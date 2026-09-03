"use client";
import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { AlertTriangle, ChevronDown, ChevronUp, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn, formatPrice } from "@/lib/utils";
import { toast } from "sonner";

const PERFIL_LABEL = { avista: "À vista", semanal: "Semanal", mensal: "Mensal" };
const PERFIL_CLASS = {
  avista: "bg-muted text-muted-foreground",
  semanal: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  mensal: "bg-purple-500/10 text-purple-500 border-purple-500/20",
};

function SectionTitle({ children }) {
  return <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">{children}</p>;
}

function formatDataBR(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function resumeItens(itens) {
  if (!itens?.length) return "Sem itens";
  return itens.map((it) => `${it.quantidade}x ${it.nome || it.menuItem?.nome || "Item"}`).join(", ");
}

function SkeletonPage() {
  return (
    <div className="px-4 pt-6 space-y-4">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-4 w-32" />
      <Separator />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
    </div>
  );
}

function ModalPagamento({ open, onClose, pedidosEmAberto, clienteId, onSuccess }) {
  const [selecionados, setSelecionados] = useState([]);
  const [observacao, setObservacao] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) { setSelecionados([]); setObservacao(""); }
  }, [open]);

  function togglePedido(id) {
    setSelecionados((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  const valorTotal = pedidosEmAberto
    .filter((p) => selecionados.includes(p._id))
    .reduce((acc, p) => acc + (p.total || 0), 0);

  async function confirmar() {
    if (selecionados.length === 0) {
      toast.error("Selecione ao menos um pedido");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/clientes/${clienteId}/pagamento`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ valor: valorTotal, pedidos_quitados: selecionados, observacao }),
      });
      if (!res.ok) throw new Error();
      toast.success("Pagamento registrado");
      onSuccess();
      onClose();
    } catch {
      toast.error("Erro ao registrar pagamento");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm mx-auto">
        <DialogHeader>
          <DialogTitle>Registrar pagamento</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <p className="text-xs text-muted-foreground mb-2">Selecione os pedidos quitados</p>
            {pedidosEmAberto.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Sem pedidos em aberto</p>
            ) : (
              <div className="rounded-xl border border-border overflow-hidden">
                {pedidosEmAberto.map((p, i) => (
                  <div key={p._id}>
                    <button
                      type="button"
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-accent/50 transition-colors text-left"
                      onClick={() => togglePedido(p._id)}
                    >
                      <div className={cn(
                        "h-5 w-5 rounded border flex items-center justify-center shrink-0 transition-colors",
                        selecionados.includes(p._id) ? "bg-primary border-primary" : "border-border"
                      )}>
                        {selecionados.includes(p._id) && <Check className="h-3 w-3 text-primary-foreground" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-muted-foreground">{formatDataBR(p.createdAt)}</p>
                        <p className="text-xs text-foreground/70 truncate">{resumeItens(p.itens)}</p>
                      </div>
                      <span className="text-sm font-semibold shrink-0">R$ {formatPrice(p.total)}</span>
                    </button>
                    {i < pedidosEmAberto.length - 1 && <Separator />}
                  </div>
                ))}
              </div>
            )}
          </div>

          {selecionados.length > 0 && (
            <div className="rounded-xl bg-primary/10 border border-primary/20 px-4 py-3 flex items-center justify-between">
              <span className="text-sm text-foreground">Total a receber</span>
              <span className="text-base font-bold text-primary">R$ {formatPrice(valorTotal)}</span>
            </div>
          )}

          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block">Observação</Label>
            <Input
              placeholder="Opcional..."
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
            />
          </div>

          <Button className="w-full" onClick={confirmar} disabled={submitting || selecionados.length === 0}>
            {submitting ? "Confirmando..." : "Confirmar pagamento"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ModalEditar({ open, onClose, cliente, onSuccess }) {
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [perfil, setPerfil] = useState("avista");
  const [observacoes, setObservacoes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (cliente) {
      setNome(cliente.nome || "");
      setTelefone(cliente.telefone || "");
      setPerfil(cliente.perfil_pagamento || "avista");
      setObservacoes(cliente.observacoes || "");
    }
  }, [cliente]);

  async function salvar() {
    if (!nome.trim()) { toast.error("Nome é obrigatório"); return; }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/clientes/${cliente._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome, telefone, perfil_pagamento: perfil, observacoes }),
      });
      if (!res.ok) throw new Error();
      toast.success("Cliente atualizado");
      onSuccess();
      onClose();
    } catch {
      toast.error("Erro ao atualizar cliente");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm mx-auto">
        <DialogHeader>
          <DialogTitle>Editar cliente</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block">Nome *</Label>
            <Input data-id="cliente-name-input" value={nome} onChange={(e) => setNome(e.target.value)} />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block">Telefone</Label>
            <Input data-id="cliente-phone-input" value={telefone} onChange={(e) => setTelefone(e.target.value)} />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block">Perfil de pagamento</Label>
            <Select value={perfil} onValueChange={setPerfil}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="avista">À vista</SelectItem>
                <SelectItem value="semanal">Semanal</SelectItem>
                <SelectItem value="mensal">Mensal</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block">Observações</Label>
            <textarea
              rows={3}
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
            />
          </div>
          <Button data-id="save-cliente-button" className="w-full" onClick={salvar} disabled={submitting}>
            {submitting ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function ClienteDetailPage() {
  const { id } = useParams();
  const router = useRouter();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [historicoPago, setHistoricoPago] = useState(false);
  const [modalPagamento, setModalPagamento] = useState(false);
  const [modalEditar, setModalEditar] = useState(false);
  const [desativando, setDesativando] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/clientes/${id}`);
      const json = await res.json();
      if (res.ok) setData(json);
      else toast.error("Cliente não encontrado");
    } catch {
      toast.error("Erro ao carregar cliente");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function desativar() {
    if (!confirm("Desativar este cliente?")) return;
    setDesativando(true);
    try {
      const res = await fetch(`/api/clientes/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ativo: !data.data.ativo }),
      });
      if (!res.ok) throw new Error();
      toast.success(data.data.ativo ? "Cliente desativado" : "Cliente reativado");
      fetchData();
    } catch {
      toast.error("Erro ao atualizar cliente");
    } finally {
      setDesativando(false);
    }
  }

  if (loading) return <SkeletonPage />;
  if (!data) return null;

  const cliente = data.data;
  const pedidosEmAberto = data.pedidos_em_aberto || [];
  const historicoPagamentos = data.historico_pagamentos || [];
  const saldo = data.saldo_em_aberto || 0;

  return (
    <>
      <Tabs data-id="cliente-detail-page" defaultValue="perfil" className="flex-1">
        <div className="sticky top-14 z-20 bg-background/90 backdrop-blur-md border-b border-border">
          <TabsList className="w-full rounded-none bg-transparent h-auto p-0">
            {["perfil", "conta"].map((tab) => (
              <TabsTrigger
                key={tab}
                value={tab}
                className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent py-3 text-sm font-medium capitalize"
              >
                {tab === "perfil" ? "Perfil" : "Conta"}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {/* Aba Perfil */}
        <TabsContent value="perfil" className="px-4 pt-6 pb-28 space-y-6 mt-0">
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            <div className="px-4 py-4">
              <div className="flex items-start justify-between gap-2 mb-3">
                <div>
                  <h2 className="text-lg font-bold text-foreground">{cliente.nome}</h2>
                  {cliente.telefone && (
                    <p className="text-sm text-muted-foreground">{cliente.telefone}</p>
                  )}
                </div>
                <Badge variant="outline" className={cn("text-xs shrink-0", PERFIL_CLASS[cliente.perfil_pagamento])}>
                  {PERFIL_LABEL[cliente.perfil_pagamento]}
                </Badge>
              </div>

              {!cliente.ativo && (
                <Badge variant="outline" className="text-xs text-muted-foreground mb-3">Inativo</Badge>
              )}

              {cliente.observacoes && (
                <p className="text-sm text-muted-foreground">{cliente.observacoes}</p>
              )}
            </div>

            <Separator />

            <div className="flex gap-2 px-4 py-3">
              <Button data-id="edit-cliente-button" variant="outline" className="flex-1 h-9" onClick={() => setModalEditar(true)}>
                Editar
              </Button>
              <Button
                data-id="delete-cliente-button"
                variant="outline"
                className={cn("flex-1 h-9", cliente.ativo ? "text-destructive border-destructive/30 hover:bg-destructive/10" : "")}
                onClick={desativar}
                disabled={desativando}
              >
                {cliente.ativo ? "Desativar" : "Reativar"}
              </Button>
            </div>
          </div>

          {cliente.enderecos?.length > 0 && (
            <div>
              <SectionTitle>Endereços</SectionTitle>
              <div data-id="cliente-enderecos-list" className="rounded-2xl border border-border bg-card overflow-hidden">
                {cliente.enderecos.map((end, i) => (
                  <div key={i} data-id={`cliente-endereco-item-${i}`}>
                    <div className="px-4 py-3.5">
                      <p className="text-xs font-semibold text-foreground mb-0.5">{end.label || "Endereço"}</p>
                      <p className="text-sm text-muted-foreground">
                        {[end.rua, end.numero].filter(Boolean).join(", ")}
                        {end.bairro && ` — ${end.bairro}`}
                        {end.complemento && `, ${end.complemento}`}
                        {end.referencia && ` (${end.referencia})`}
                      </p>
                    </div>
                    {i < cliente.enderecos.length - 1 && <Separator />}
                  </div>
                ))}
              </div>
            </div>
          )}
        </TabsContent>

        {/* Aba Conta */}
        <TabsContent value="conta" className="px-4 pt-6 pb-28 space-y-6 mt-0">
          {/* Saldo */}
          <div className={cn(
            "rounded-2xl border p-6 text-center",
            saldo > 0 ? "border-red-500/30 bg-red-500/5" : "border-border bg-card"
          )}>
            {saldo > 0 ? (
              <>
                <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-2" />
                <p className="text-xs text-muted-foreground mb-1">Saldo em aberto</p>
                <p className="text-3xl font-bold text-red-500">R$ {formatPrice(saldo)}</p>
              </>
            ) : (
              <>
                <Check className="h-8 w-8 text-green-500 mx-auto mb-2" />
                <p className="text-sm font-semibold text-foreground mb-1">Sem débitos em aberto</p>
                <p className="text-xs text-muted-foreground">Conta zerada</p>
              </>
            )}
          </div>

          {pedidosEmAberto.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <SectionTitle>Pedidos em aberto</SectionTitle>
                <Button data-id="register-payment-button" size="sm" className="h-8 text-xs" onClick={() => setModalPagamento(true)}>
                  Registrar pagamento
                </Button>
              </div>
              <div data-id="pedidos-em-aberto-list" className="rounded-2xl border border-border bg-card overflow-hidden">
                {pedidosEmAberto.map((p, i) => (
                  <div key={p._id} data-id={`pedido-aberto-item-${p._id}`}>
                    <div className="px-4 py-3.5">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-xs text-muted-foreground">{formatDataBR(p.createdAt)}</p>
                        <span className="text-sm font-bold text-foreground">R$ {formatPrice(p.total)}</span>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-1">{resumeItens(p.itens)}</p>
                    </div>
                    {i < pedidosEmAberto.length - 1 && <Separator />}
                  </div>
                ))}
              </div>
            </div>
          )}

          {saldo === 0 && pedidosEmAberto.length === 0 && historicoPagamentos.length === 0 && (
            <p className="text-xs text-center text-muted-foreground py-6">Nenhum histórico disponível</p>
          )}

          {historicoPagamentos.length > 0 && (
            <div data-id="historico-pagamentos-section">
              <button
                data-id="historico-pagamentos-toggle"
                type="button"
                className="flex items-center gap-2 mb-3 w-full"
                onClick={() => setHistoricoPago((v) => !v)}
              >
                <SectionTitle>Histórico de pagamentos</SectionTitle>
                {historicoPago ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />}
              </button>

              {historicoPago && (
                <div className="rounded-2xl border border-border bg-card overflow-hidden">
                  {historicoPagamentos.map((pg, i) => (
                    <div key={pg._id || i}>
                      <div className="px-4 py-3.5">
                        <div className="flex items-center justify-between mb-0.5">
                          <p className="text-xs text-muted-foreground">{formatDataBR(pg.createdAt || pg.data)}</p>
                          <span className="text-sm font-bold text-green-500">+ R$ {formatPrice(pg.valor)}</span>
                        </div>
                        {pg.observacao && (
                          <p className="text-xs text-muted-foreground">{pg.observacao}</p>
                        )}
                      </div>
                      {i < historicoPagamentos.length - 1 && <Separator />}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <ModalPagamento
        open={modalPagamento}
        onClose={() => setModalPagamento(false)}
        pedidosEmAberto={pedidosEmAberto}
        clienteId={id}
        onSuccess={fetchData}
      />

      <ModalEditar
        open={modalEditar}
        onClose={() => setModalEditar(false)}
        cliente={cliente}
        onSuccess={fetchData}
      />
    </>
  );
}
