"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { RotateCcw, Calendar } from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { formatPrice, formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

export default function OrderFechadaDetailPage() {
  const [comanda, setComanda] = useState(null);
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reopening, setReopening] = useState(false);
  const { id } = useParams();
  const router = useRouter();

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

  async function handleReopen() {
    setReopening(true);
    try {
      await fetch(`/api/comandas/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reabrir" }),
      });
      toast.success("Comanda reaberta!");
      router.push("/orders");
    } catch {
      toast.error("Erro ao reabrir");
      setReopening(false);
    }
  }

  const total = pedidos.reduce((acc, p) => acc + p.preco * p.quantidade, 0);

  return (
    <>
      <div className="pb-44">
        <div className="px-4 pt-4 flex flex-col gap-4">

          {/* Info da comanda */}
          {comanda && (
            <div className="rounded-2xl bg-card border border-border px-4 py-4 flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center shrink-0">
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground">Fechada em</p>
                <p className="text-sm font-medium text-foreground">{formatDate(comanda.fechadaEm)}</p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-muted text-muted-foreground">
                Fechada
              </span>
            </div>
          )}

          {/* Skeletons */}
          {loading && (
            <div className="rounded-2xl border border-border overflow-hidden bg-card">
              {[...Array(3)].map((_, i) => (
                <div key={i}>
                  <div className="flex items-center justify-between px-4 py-4">
                    <div className="flex flex-col gap-1.5">
                      <Skeleton className="h-4 w-36" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                    <Skeleton className="h-4 w-16" />
                  </div>
                  {i < 2 && <Separator />}
                </div>
              ))}
            </div>
          )}

          {/* Lista de itens */}
          {!loading && pedidos.length > 0 && (
            <div className="rounded-2xl border border-border bg-card overflow-hidden">
              {pedidos.map((p, i) => (
                <div key={p._id}>
                  <div className="flex items-center gap-3 px-4 py-3.5">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{p.nome}</p>
                      <p className="text-xs text-muted-foreground tabular-nums mt-0.5">
                        R$&nbsp;{formatPrice(p.preco)} × {p.quantidade}
                      </p>
                    </div>
                    <p className="text-sm font-semibold tabular-nums text-foreground shrink-0">
                      R$&nbsp;{formatPrice(p.preco * p.quantidade)}
                    </p>
                  </div>
                  {i < pedidos.length - 1 && <Separator />}
                </div>
              ))}
            </div>
          )}

        </div>
      </div>

      {/* Bottom bar */}
      <div className="fixed bottom-0 left-0 right-0 z-30">
        <div className="bg-gradient-to-t from-background via-background to-transparent h-6" />
        <div className="bg-background border-t border-border px-4 pb-6 pt-4">
          <div className="flex items-center gap-3 max-w-md mx-auto">

            {/* Total */}
            <div className="flex-1 bg-card border border-border rounded-2xl px-4 py-3">
              <p className="text-xs text-muted-foreground leading-none mb-1">Total</p>
              <p className="text-lg font-bold tabular-nums leading-none">
                R$&nbsp;{formatPrice(total)}
              </p>
            </div>

            {/* Reabrir */}
            <button
              onClick={handleReopen}
              disabled={reopening}
              className={cn(
                "h-[62px] px-5 rounded-2xl border border-border bg-card text-foreground font-semibold text-sm flex items-center gap-2 shrink-0 transition-all",
                "hover:bg-accent active:scale-[0.98]",
                reopening && "opacity-70"
              )}
            >
              <RotateCcw className="h-4 w-4" />
              {reopening ? "..." : "Reabrir"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
