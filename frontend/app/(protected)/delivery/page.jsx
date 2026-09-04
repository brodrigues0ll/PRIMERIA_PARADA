"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Plus, Truck, RefreshCw, Wallet, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { cn, formatPrice } from "@/lib/utils";
import { toast } from "sonner";
import { usePermissao } from "@/hooks/usePermissao";

const STATUS_TABS = [
  { value: "recebido", label: "Recebidos" },
  { value: "em_preparo", label: "Em Preparo" },
  { value: "saiu", label: "Saiu" },
  { value: "entregue", label: "Concluídos" },
];

const NEXT_STATUS = {
  recebido: { label: "Iniciar preparo", next: "em_preparo" },
  em_preparo: { label: "Marcar saiu", next: "saiu" },
  saiu: { label: "Confirmar entrega", next: "entregue" },
};

const PAYMENT_LABEL = {
  dinheiro: "Dinheiro",
  pix: "Pix",
  cartao: "Cartão",
  credito: "Crédito",
  debito: "Débito",
  conta: "Na conta",
  misto: "Misto",
};

function todayISO() {
  return new Date().toISOString().split("T")[0];
}

function resumeItens(itens) {
  if (!itens?.length) return "Sem itens";
  return itens
    .map((it) => `${it.quantidade}x ${it.nome || it.menuItem?.nome || "Item"}`)
    .join(", ");
}

function PedidoCard({ pedido, onUpdate }) {
  const [loading, setLoading] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const podeCancelar = usePermissao("delivery.cancel");

  const nextAction = NEXT_STATUS[pedido.status];
  const nomeCliente = pedido.cliente?.nome || pedido.nome_avulso || "Cliente avulso";
  const bairro = pedido.endereco_entrega?.bairro;
  const trocoVal = pedido.troco_para ? pedido.troco_para - pedido.total : null;
  const isEntregue = pedido.status === "entregue";
  const isCancelado = pedido.status === "cancelado";

  async function avancarStatus() {
    setLoading(true);
    try {
      const res = await fetch(`/api/delivery/${pedido._id}/status`, { method: "PATCH" });
      if (!res.ok) throw new Error();
      toast.success("Status atualizado");
      onUpdate();
    } catch {
      toast.error("Erro ao atualizar status");
    } finally {
      setLoading(false);
    }
  }

  async function confirmarCancelamento() {
    setCancelOpen(false);
    setLoading(true);
    try {
      const res = await fetch(`/api/delivery/${pedido._id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Pedido cancelado");
      onUpdate();
    } catch {
      toast.error("Erro ao cancelar pedido");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div
        data-id={`delivery-order-${pedido._id}`}
        className="rounded-2xl border border-border bg-card overflow-hidden"
      >
        <div className="px-4 pt-4 pb-3">
          <div className="flex items-start justify-between gap-2 mb-1">
            <div>
              <p className="font-semibold text-sm text-foreground">{nomeCliente}</p>
              {bairro && (
                <p className="text-xs text-muted-foreground">{bairro}</p>
              )}
            </div>
            <div className="flex flex-col items-end gap-1 shrink-0">
              <span className="text-sm font-bold text-foreground">
                R$ {formatPrice(pedido.total)}
              </span>
              {pedido.na_conta && (
                <Badge
                  variant="outline"
                  className="text-xs text-amber-500 border-amber-500/30 bg-amber-500/10"
                >
                  Na conta
                </Badge>
              )}
            </div>
          </div>

          <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
            {resumeItens(pedido.itens)}
          </p>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Wallet className="h-3 w-3 shrink-0" />
            <span>{PAYMENT_LABEL[pedido.forma_pagamento] || pedido.forma_pagamento}</span>
            {trocoVal !== null && trocoVal > 0 && (
              <span className="text-foreground/60">
                · Troco: R$ {formatPrice(trocoVal)}
              </span>
            )}
          </div>
        </div>

        {!isEntregue && !isCancelado && (
          <>
            <Separator />
            <div className="flex gap-2 px-4 py-3">
              {nextAction && (
                <Button
                  data-id="delivery-advance-status-button"
                  size="sm"
                  className="flex-1 h-9"
                  onClick={avancarStatus}
                  disabled={loading}
                >
                  {nextAction.label}
                </Button>
              )}
              {podeCancelar && (
                <Button
                  data-id="delivery-cancel-button"
                  size="sm"
                  variant="outline"
                  className="h-9 text-destructive border-destructive/30 hover:bg-destructive/10"
                  onClick={() => setCancelOpen(true)}
                  disabled={loading}
                >
                  Cancelar
                </Button>
              )}
            </div>
          </>
        )}
      </div>

      <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancelar pedido?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            O pedido de <strong>{nomeCliente}</strong> (R$ {formatPrice(pedido.total)}) será
            cancelado. Esta ação não pode ser desfeita.
          </p>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setCancelOpen(false)}>
              Voltar
            </Button>
            <Button variant="destructive" onClick={confirmarCancelamento}>
              Cancelar pedido
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function TabSkeleton() {
  return (
    <div className="space-y-3">
      {[...Array(3)].map((_, i) => (
        <div
          key={i}
          className="rounded-2xl border border-border bg-card overflow-hidden p-4 space-y-2"
        >
          <div className="flex justify-between">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-16" />
          </div>
          <Skeleton className="h-3 w-48" />
          <Skeleton className="h-3 w-24" />
          <Separator className="my-2" />
          <div className="flex gap-2">
            <Skeleton className="h-9 flex-1 rounded-md" />
            <Skeleton className="h-9 w-20 rounded-md" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function DeliveryPage() {
  const router = useRouter();
  const [date, setDate] = useState(todayISO());
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busca, setBusca] = useState("");

  const fetchPedidos = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);
      else setRefreshing(true);
      try {
        const res = await fetch(`/api/delivery?data=${date}`);
        const json = await res.json();
        if (res.ok) setPedidos(json.data || []);
      } catch {
        toast.error("Erro ao carregar pedidos");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [date]
  );

  useEffect(() => {
    fetchPedidos();
  }, [fetchPedidos]);

  function byStatus(status) {
    let lista = pedidos.filter((p) => p.status === status);
    if (busca.trim()) {
      const q = busca.toLowerCase();
      lista = lista.filter(
        (p) =>
          (p.cliente?.nome || p.nome_avulso || "").toLowerCase().includes(q) ||
          (p.endereco_entrega?.bairro || "").toLowerCase().includes(q)
      );
    }
    return lista;
  }

  const totalAtivos = ["recebido", "em_preparo", "saiu"].reduce(
    (acc, s) => acc + pedidos.filter((p) => p.status === s).length,
    0
  );

  return (
    <>
      <div
        data-id="delivery-header"
        className="sticky top-14 z-20 bg-background/90 backdrop-blur-md border-b border-border px-4 py-3 space-y-2"
      >
        <div className="flex items-center gap-2">
          <input
            data-id="delivery-date-filter"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="flex-1 h-9 rounded-lg border border-border bg-card px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <Button
            data-id="delivery-refresh-button"
            variant="ghost"
            size="icon"
            className="h-9 w-9 shrink-0"
            onClick={() => fetchPedidos(true)}
            disabled={refreshing}
          >
            <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
          </Button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          <input
            data-id="delivery-search"
            type="text"
            placeholder="Buscar por cliente ou bairro..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full h-9 rounded-lg border border-border bg-card pl-9 pr-9 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
          {busca && (
            <button
              onClick={() => setBusca("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      <div data-id="delivery-page" className="px-4 pt-4 pb-28">
        <Tabs defaultValue="recebido">
          <TabsList className="w-full mb-4 grid grid-cols-4 h-auto">
            {STATUS_TABS.map((tab) => {
              const count = byStatus(tab.value).length;
              const isActive = ["recebido", "em_preparo"].includes(tab.value);
              return (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="flex flex-col gap-0.5 py-2 text-xs leading-tight"
                >
                  <span>{tab.label}</span>
                  {count > 0 && (
                    <Badge
                      variant="secondary"
                      className={cn(
                        "h-4 min-w-4 px-1 text-[10px]",
                        isActive && "bg-primary text-primary-foreground"
                      )}
                    >
                      {count}
                    </Badge>
                  )}
                </TabsTrigger>
              );
            })}
          </TabsList>

          {STATUS_TABS.map((tab) => (
            <TabsContent key={tab.value} value={tab.value}>
              {loading ? (
                <TabSkeleton />
              ) : byStatus(tab.value).length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="h-14 w-14 rounded-2xl bg-muted flex items-center justify-center mb-4">
                    <Truck className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-semibold text-foreground mb-1">
                    {busca ? "Nenhum resultado" : "Nenhum pedido"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {busca
                      ? `Sem pedidos para "${busca}"`
                      : "Sem pedidos neste status para a data selecionada"}
                  </p>
                </div>
              ) : (
                <div data-id="delivery-list" className="space-y-3 mt-4">
                  {byStatus(tab.value).map((pedido) => (
                    <PedidoCard
                      key={pedido._id}
                      pedido={pedido}
                      onUpdate={() => fetchPedidos(true)}
                    />
                  ))}
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>

      <div className="fixed bottom-6 right-5 z-30">
        <Button
          data-id="add-delivery-button"
          size="icon"
          className="h-14 w-14 rounded-2xl bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25"
          onClick={() => router.push("/delivery/novo")}
        >
          <Plus className="h-6 w-6" />
        </Button>
      </div>
    </>
  );
}
