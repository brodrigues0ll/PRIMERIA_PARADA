"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { Plus, Minus, ShoppingBag, CheckCircle, Check, Users } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import AddProductsModal from "@/components/AddProductsModal";
import { formatPrice } from "@/lib/utils";
import { cn } from "@/lib/utils";

export default function OrderDetailPage() {
  const [comanda, setComanda] = useState(null);
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const [mutating, setMutating] = useState(null);

  const router = useRouter();
  const { id } = useParams();

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/comandas/${id}`);
      const data = await res.json();
      if (res.ok) { setComanda(data.data); setPedidos(data.data.pedidos || []); }
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function handleQty(pedidoId, action) {
    setMutating(pedidoId);
    await fetch(`/api/comandas/${id}/pedidos/${pedidoId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    await fetchData();
    setMutating(null);
  }

  async function handleTogglePago(nome) {
    const pagantesPagos = comanda?.pagantesPagos ?? [];
    const jaPago = pagantesPagos.includes(nome);
    const novos = jaPago
      ? pagantesPagos.filter((n) => n !== nome)
      : [...pagantesPagos, nome];

    // Optimistic update
    setComanda((prev) => ({ ...prev, pagantesPagos: novos }));

    try {
      await fetch(`/api/comandas/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "pagantesPagos", pagantesPagos: novos }),
      });
    } catch {
      toast.error("Erro ao registrar pagamento");
      fetchData();
    }
  }

  async function handleClose() {
    if (!pedidos.length) { toast.warning("Adicione itens antes de fechar"); return; }
    setClosing(true);
    try {
      await fetch(`/api/comandas/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "fechar" }),
      });
      toast.success("Comanda fechada!");
      router.push("/orders");
    } catch {
      toast.error("Erro ao fechar comanda");
      setClosing(false);
    }
  }

  const isGrupo = !!comanda?.grupo;
  const pagantes = comanda?.pagantes ?? [];
  const pagantesPagos = comanda?.pagantesPagos ?? [];
  const total = pedidos.reduce((acc, p) => acc + p.preco * p.quantidade, 0);

  const grupos = pedidos.reduce((acc, p) => {
    const key = p.pagante ?? "__sem__";
    if (!acc[key]) acc[key] = [];
    acc[key].push(p);
    return acc;
  }, {});
  const pagantesComItens = Object.keys(grupos).filter((k) => k !== "__sem__").sort();
  const semPagante = grupos["__sem__"] ?? [];

  function PedidoRow({ p, muted }) {
    return (
      <div className={cn("flex items-center gap-3 px-4 py-3.5 transition-opacity", muted && "opacity-50")}>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground truncate leading-snug">
            {p.nome}
          </p>
          <p className="text-xs text-muted-foreground tabular-nums mt-0.5">
            R$&nbsp;{formatPrice(p.preco)} × {p.quantidade}
            <span className="text-foreground/60 font-medium ml-1">
              = R$&nbsp;{formatPrice(p.preco * p.quantidade)}
            </span>
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => handleQty(p._id, "decrement")}
            disabled={mutating === p._id || muted}
            className={cn(
              "h-8 w-8 rounded-lg border border-border flex items-center justify-center transition-colors",
              "hover:bg-accent active:scale-95",
              (mutating === p._id || muted) && "opacity-40"
            )}
          >
            <Minus className="h-3.5 w-3.5 text-foreground" />
          </button>
          <span className="text-sm font-bold w-6 text-center tabular-nums">
            {p.quantidade}
          </span>
          <button
            onClick={() => handleQty(p._id, "increment")}
            disabled={mutating === p._id || muted}
            className={cn(
              "h-8 w-8 rounded-lg border border-border flex items-center justify-center transition-colors",
              "hover:bg-accent active:scale-95",
              (mutating === p._id || muted) && "opacity-40"
            )}
          >
            <Plus className="h-3.5 w-3.5 text-foreground" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="pb-44">

        {/* Skeletons */}
        {loading && (
          <div className="mx-4 mt-4 rounded-2xl border border-border overflow-hidden bg-card">
            {[...Array(3)].map((_, i) => (
              <div key={i}>
                <div className="flex items-center justify-between px-4 py-4">
                  <div className="flex flex-col gap-1.5">
                    <Skeleton className="h-4 w-36" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <Skeleton className="h-8 w-24 rounded-lg" />
                </div>
                {i < 2 && <Separator />}
              </div>
            ))}
          </div>
        )}

        {/* Pagantes da comanda em grupo */}
        {!loading && isGrupo && pagantes.length > 0 && (
          <div className="px-4 pt-4">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Users className="h-3.5 w-3.5" />
                Pagantes:
              </span>
              {pagantes.map((nome) => {
                const pago = pagantesPagos.includes(nome);
                return (
                  <span
                    key={nome}
                    className={cn(
                      "px-2.5 py-0.5 rounded-full text-xs font-medium",
                      pago
                        ? "bg-emerald-500/15 text-emerald-600 line-through"
                        : "bg-primary/10 text-primary"
                    )}
                  >
                    {nome}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {/* Empty */}
        {!loading && pedidos.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 px-8 text-center">
            <div className="h-14 w-14 rounded-2xl bg-muted flex items-center justify-center mb-4">
              <ShoppingBag className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm font-semibold text-foreground mb-1">Nenhum item ainda</p>
            <p className="text-xs text-muted-foreground">Toque no + para adicionar produtos</p>
          </div>
        )}

        {/* Lista de pedidos — comanda simples */}
        {!loading && !isGrupo && pedidos.length > 0 && (
          <div className="px-4 pt-4">
            <div className="rounded-2xl border border-border bg-card overflow-hidden">
              {pedidos.map((p, i) => (
                <div key={p._id}>
                  <PedidoRow p={p} />
                  {i < pedidos.length - 1 && <Separator />}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Lista de pedidos — comanda em grupo (agrupada por pagante) */}
        {!loading && isGrupo && pedidos.length > 0 && (
          <div className="px-4 pt-4 space-y-4">
            {pagantesComItens.map((nome) => {
              const itens = grupos[nome];
              const subtotal = itens.reduce((a, p) => a + p.preco * p.quantidade, 0);
              const pago = pagantesPagos.includes(nome);

              return (
                <div key={nome}>
                  <div className="flex items-center justify-between mb-1.5 px-1">
                    <button
                      onClick={() => handleTogglePago(nome)}
                      className="flex items-center gap-2 group"
                    >
                      <span
                        className={cn(
                          "h-5 w-5 rounded-full border-2 flex items-center justify-center transition-all shrink-0",
                          pago
                            ? "bg-emerald-500 border-emerald-500"
                            : "border-border group-hover:border-emerald-400"
                        )}
                      >
                        {pago && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
                      </span>
                      <span
                        className={cn(
                          "text-xs font-semibold uppercase tracking-wide transition-colors",
                          pago ? "text-emerald-500" : "text-primary group-hover:text-primary/80"
                        )}
                      >
                        {nome}
                      </span>
                    </button>
                    <span className={cn(
                      "text-xs tabular-nums font-medium",
                      pago ? "text-emerald-500" : "text-muted-foreground"
                    )}>
                      R$&nbsp;{formatPrice(subtotal)}
                    </span>
                  </div>
                  <div
                    className={cn(
                      "rounded-2xl border bg-card overflow-hidden transition-colors",
                      pago ? "border-emerald-500/30" : "border-border"
                    )}
                  >
                    {itens.map((p, i) => (
                      <div key={p._id}>
                        <PedidoRow p={p} muted={pago} />
                        {i < itens.length - 1 && <Separator />}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}

            {semPagante.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-1.5 px-1">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Sem pagante
                  </span>
                  <span className="text-xs text-muted-foreground tabular-nums">
                    R$&nbsp;{formatPrice(semPagante.reduce((a, p) => a + p.preco * p.quantidade, 0))}
                  </span>
                </div>
                <div className="rounded-2xl border border-border bg-card overflow-hidden">
                  {semPagante.map((p, i) => (
                    <div key={p._id}>
                      <PedidoRow p={p} />
                      {i < semPagante.length - 1 && <Separator />}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom bar */}
      <div className="fixed bottom-0 left-0 right-0 z-30">
        <div className="bg-gradient-to-t from-background via-background to-transparent h-6" />
        <div className="bg-background border-t border-border px-4 pb-6 pt-4">
          <div className="flex items-center gap-3 max-w-md mx-auto">
            <div className="flex-1 bg-card border border-border rounded-2xl px-4 py-3">
              <p className="text-xs text-muted-foreground leading-none mb-1">Total</p>
              <p className="text-lg font-bold tabular-nums leading-none">
                R$&nbsp;{formatPrice(total)}
              </p>
            </div>
            <button
              onClick={() => setModalOpen(true)}
              className="h-[62px] w-[62px] rounded-2xl border border-border bg-card flex items-center justify-center hover:bg-accent transition-colors shrink-0"
            >
              <Plus className="h-5 w-5 text-foreground" />
            </button>
            <button
              onClick={handleClose}
              disabled={closing}
              className={cn(
                "h-[62px] px-5 rounded-2xl bg-primary text-primary-foreground font-semibold text-sm flex items-center gap-2 shrink-0 transition-all",
                "hover:bg-primary/90 active:scale-[0.98]",
                closing && "opacity-70"
              )}
            >
              <CheckCircle className="h-4 w-4" />
              {closing ? "..." : "Fechar"}
            </button>
          </div>
        </div>
      </div>

      <AddProductsModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        comandaId={id}
        onAdded={fetchData}
        isGrupo={isGrupo}
        pagantes={pagantes}
      />
    </>
  );
}
