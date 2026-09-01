"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { Plus, Trash2, CheckCircle, RotateCcw, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatPrice } from "@/lib/utils";

const CATEGORIAS_CONTA = [
  "Compra de insumos",
  "Despesa fixa",
  "Folha de pagamento",
  "Aluguel",
  "Utilities",
  "Outros",
];

function formatDataBR(date) {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function isVencida(date) {
  if (!date) return false;
  return new Date(date) < new Date(new Date().setHours(0, 0, 0, 0));
}

export default function ContasPagarPage() {
  const [statusFiltro, setStatusFiltro] = useState("pendente");
  const [contas, setContas] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal nova conta
  const [modalNova, setModalNova] = useState(false);
  const [form, setForm] = useState({
    descricao: "",
    valor: "",
    vencimento: "",
    categoria: "",
    observacoes: "",
  });
  const [salvando, setSalvando] = useState(false);

  // Modal pagar
  const [modalPagar, setModalPagar] = useState(null); // conta selecionada
  const [caixas, setCaixas] = useState([]);
  const [caixaIdPagamento, setCaixaIdPagamento] = useState("");
  const [pagando, setPagando] = useState(false);

  // Ações em andamento
  const [acaoId, setAcaoId] = useState(null);

  const fetchContas = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/contas-pagar?status=${statusFiltro}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setContas(json.data || []);
    } catch (err) {
      toast.error(err.message || "Erro ao carregar contas");
    } finally {
      setLoading(false);
    }
  }, [statusFiltro]);

  const fetchCaixasAbertos = useCallback(async () => {
    try {
      const res = await fetch("/api/caixa/historico");
      const json = await res.json();
      if (res.ok) {
        setCaixas((json.data || []).filter((c) => c.status === "aberto"));
      }
    } catch {
      // silencioso
    }
  }, []);

  useEffect(() => {
    fetchContas();
  }, [fetchContas]);

  useEffect(() => {
    fetchCaixasAbertos();
  }, [fetchCaixasAbertos]);

  const handleCriarConta = async (e) => {
    e.preventDefault();
    if (!form.descricao.trim()) {
      toast.error("Descrição é obrigatória");
      return;
    }
    if (!form.valor || parseFloat(form.valor) < 0) {
      toast.error("Valor inválido");
      return;
    }
    if (!form.vencimento) {
      toast.error("Vencimento é obrigatório");
      return;
    }
    if (!form.categoria) {
      toast.error("Categoria é obrigatória");
      return;
    }

    setSalvando(true);
    try {
      const res = await fetch("/api/contas-pagar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          descricao: form.descricao,
          valor: parseFloat(form.valor),
          vencimento: form.vencimento,
          categoria: form.categoria,
          observacoes: form.observacoes,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      toast.success("Conta cadastrada!");
      setModalNova(false);
      setForm({ descricao: "", valor: "", vencimento: "", categoria: "", observacoes: "" });
      fetchContas();
    } catch (err) {
      toast.error(err.message || "Erro ao cadastrar conta");
    } finally {
      setSalvando(false);
    }
  };

  const handlePagar = async () => {
    if (!modalPagar) return;
    setPagando(true);
    try {
      const res = await fetch(`/api/contas-pagar/${modalPagar._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "pagar",
          caixaId: caixaIdPagamento || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      toast.success("Conta marcada como paga!");
      setModalPagar(null);
      setCaixaIdPagamento("");
      fetchContas();
    } catch (err) {
      toast.error(err.message || "Erro ao pagar conta");
    } finally {
      setPagando(false);
    }
  };

  const handleReabrir = async (id) => {
    setAcaoId(id);
    try {
      const res = await fetch(`/api/contas-pagar/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reabrir" }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      toast.success("Conta reaberta");
      fetchContas();
    } catch (err) {
      toast.error(err.message || "Erro ao reabrir conta");
    } finally {
      setAcaoId(null);
    }
  };

  const handleDeletar = async (id) => {
    setAcaoId(id);
    try {
      const res = await fetch(`/api/contas-pagar/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      toast.success("Conta removida");
      setContas((prev) => prev.filter((c) => c._id !== id));
    } catch (err) {
      toast.error(err.message || "Erro ao remover conta");
    } finally {
      setAcaoId(null);
    }
  };

  const totalPendente = contas
    .filter((c) => c.status === "pendente")
    .reduce((acc, c) => acc + c.valor, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-foreground">Contas a Pagar</h1>
        <Button
          onClick={() => setModalNova(true)}
          className="bg-primary text-primary-foreground"
          size="sm"
        >
          <Plus className="h-4 w-4 mr-1" />
          Conta
        </Button>
      </div>

      {/* Toggle de status */}
      <div className="flex rounded-xl overflow-hidden border border-border">
        <button
          onClick={() => setStatusFiltro("pendente")}
          className={`flex-1 py-2 text-sm font-medium transition-colors ${
            statusFiltro === "pendente"
              ? "bg-primary text-primary-foreground"
              : "bg-card text-muted-foreground hover:text-foreground"
          }`}
        >
          Pendentes
        </button>
        <button
          onClick={() => setStatusFiltro("pago")}
          className={`flex-1 py-2 text-sm font-medium transition-colors ${
            statusFiltro === "pago"
              ? "bg-primary text-primary-foreground"
              : "bg-card text-muted-foreground hover:text-foreground"
          }`}
        >
          Pagas
        </button>
        <button
          onClick={() => setStatusFiltro("todos")}
          className={`flex-1 py-2 text-sm font-medium transition-colors ${
            statusFiltro === "todos"
              ? "bg-primary text-primary-foreground"
              : "bg-card text-muted-foreground hover:text-foreground"
          }`}
        >
          Todas
        </button>
      </div>

      {/* Total pendente */}
      {statusFiltro !== "pago" && contas.some((c) => c.status === "pendente") && (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-3">
          <p className="text-xs text-red-500 mb-1">Total pendente</p>
          <p className="font-semibold text-red-500">R$ {formatPrice(totalPendente)}</p>
        </div>
      )}

      {/* Lista */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full rounded-2xl" />
          ))}
        </div>
      ) : contas.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-8 text-center">
          <p className="text-sm text-muted-foreground">Nenhuma conta encontrada</p>
        </div>
      ) : (
        <div className="space-y-2">
          {contas.map((conta) => {
            const vencida = conta.status === "pendente" && isVencida(conta.vencimento);
            return (
              <div
                key={conta._id}
                className={`rounded-2xl border bg-card p-4 ${
                  vencida ? "border-red-500/40" : "border-border"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium text-foreground truncate">
                        {conta.descricao}
                      </p>
                      {vencida && (
                        <div className="flex items-center gap-1 text-red-500">
                          <AlertCircle className="h-3 w-3" />
                          <span className="text-xs">Vencida</span>
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {conta.categoria}
                    </p>
                    <p
                      className={`text-xs mt-0.5 ${
                        vencida ? "text-red-500 font-medium" : "text-muted-foreground"
                      }`}
                    >
                      Venc: {formatDataBR(conta.vencimento)}
                    </p>
                    {conta.status === "pago" && conta.pago_em && (
                      <p className="text-xs text-muted-foreground">
                        Pago em: {formatDataBR(conta.pago_em)}
                      </p>
                    )}
                    {conta.observacoes && (
                      <p className="text-xs text-muted-foreground truncate">
                        {conta.observacoes}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <p className="text-sm font-semibold text-foreground">
                      R$ {formatPrice(conta.valor)}
                    </p>
                    <Badge
                      variant="outline"
                      className={
                        conta.status === "pago"
                          ? "border-green-500 text-green-600 text-xs"
                          : vencida
                          ? "border-red-500 text-red-500 text-xs"
                          : "border-yellow-500 text-yellow-600 text-xs"
                      }
                    >
                      {conta.status === "pago"
                        ? "Pago"
                        : vencida
                        ? "Vencida"
                        : "Pendente"}
                    </Badge>
                  </div>
                </div>

                {/* Ações */}
                <div className="flex gap-2 mt-3 pt-3 border-t border-border">
                  {conta.status === "pendente" && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 text-green-600 border-green-500/30 hover:bg-green-500/10"
                        onClick={() => setModalPagar(conta)}
                        disabled={acaoId === conta._id}
                      >
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Pagar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-destructive border-destructive/30 hover:bg-destructive/10"
                        onClick={() => handleDeletar(conta._id)}
                        disabled={acaoId === conta._id}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </>
                  )}
                  {conta.status === "pago" && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => handleReabrir(conta._id)}
                      disabled={acaoId === conta._id}
                    >
                      <RotateCcw className="h-3 w-3 mr-1" />
                      Reabrir
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Nova Conta */}
      <Dialog open={modalNova} onOpenChange={setModalNova}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Conta a Pagar</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCriarConta} className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Input
                type="text"
                placeholder="Ex: Conta de luz"
                value={form.descricao}
                onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))}
                className="bg-background border-input"
              />
            </div>

            <div className="space-y-2">
              <Label>Valor (R$)</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                placeholder="0,00"
                value={form.valor}
                onChange={(e) => setForm((f) => ({ ...f, valor: e.target.value }))}
                className="bg-background border-input"
              />
            </div>

            <div className="space-y-2">
              <Label>Vencimento</Label>
              <Input
                type="date"
                value={form.vencimento}
                onChange={(e) =>
                  setForm((f) => ({ ...f, vencimento: e.target.value }))
                }
                className="bg-background border-input"
              />
            </div>

            <div className="space-y-2">
              <Label>Categoria</Label>
              <select
                value={form.categoria}
                onChange={(e) => setForm((f) => ({ ...f, categoria: e.target.value }))}
                className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">Selecione...</option>
                {CATEGORIAS_CONTA.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label>Observações (opcional)</Label>
              <Input
                type="text"
                placeholder="Notas adicionais..."
                value={form.observacoes}
                onChange={(e) =>
                  setForm((f) => ({ ...f, observacoes: e.target.value }))
                }
                className="bg-background border-input"
              />
            </div>

            <Button
              type="submit"
              disabled={salvando}
              className="w-full bg-primary text-primary-foreground"
            >
              {salvando ? "Salvando..." : "Cadastrar conta"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal Pagar */}
      <Dialog open={!!modalPagar} onOpenChange={() => { setModalPagar(null); setCaixaIdPagamento(""); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pagar Conta</DialogTitle>
          </DialogHeader>
          {modalPagar && (
            <div className="space-y-4 pt-2">
              <div className="rounded-xl bg-muted/50 p-4 space-y-1">
                <p className="font-medium text-foreground">{modalPagar.descricao}</p>
                <p className="text-sm text-muted-foreground">{modalPagar.categoria}</p>
                <p className="text-lg font-semibold text-foreground">
                  R$ {formatPrice(modalPagar.valor)}
                </p>
              </div>

              <div className="space-y-2">
                <Label>Registrar no caixa (opcional)</Label>
                <select
                  value={caixaIdPagamento}
                  onChange={(e) => setCaixaIdPagamento(e.target.value)}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">Não registrar no caixa</option>
                  {caixas.map((c) => (
                    <option key={c._id} value={c._id}>
                      Caixa de{" "}
                      {new Date(c.data).toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                      })}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground">
                  Se selecionar um caixa, um lançamento de saída será criado automaticamente.
                </p>
              </div>

              <Button
                onClick={handlePagar}
                disabled={pagando}
                className="w-full bg-primary text-primary-foreground"
              >
                {pagando ? "Processando..." : "Confirmar pagamento"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
