"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { Plus, TrendingUp, TrendingDown, Trash2, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatPrice } from "@/lib/utils";
import { FORMAS_PAGAMENTO } from "@/lib/constants/financeiro";

function formatDataBR(date) {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatHoraBR(date) {
  if (!date) return "";
  return new Date(date).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function LancamentosPage() {
  const [caixas, setCaixas] = useState([]);
  const [loadingCaixas, setLoadingCaixas] = useState(true);
  const [caixaSelecionado, setCaixaSelecionado] = useState(null);
  const [lancamentos, setLancamentos] = useState([]);
  const [loadingLanc, setLoadingLanc] = useState(false);

  // Modal novo lançamento
  const [modalLancamento, setModalLancamento] = useState(false);
  const [lancForm, setLancForm] = useState({
    tipo: "entrada",
    categoria: "",
    valor: "",
    descricao: "",
    forma_pagamento: "",
    membro_familiar: "",
  });
  const [membros, setMembros] = useState([]);
  const [categorias, setCategorias] = useState({ entrada: [], saida: [] });
  const [salvandoLanc, setSalvandoLanc] = useState(false);

  // Confirmação deletar
  const [deletandoId, setDeletandoId] = useState(null);

  const fetchCaixas = useCallback(async () => {
    setLoadingCaixas(true);
    try {
      const res = await fetch("/api/caixa/historico");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setCaixas(json.data || []);
      if (json.data && json.data.length > 0) {
        setCaixaSelecionado(json.data[0]);
      }
    } catch (err) {
      toast.error(err.message || "Erro ao carregar histórico");
    } finally {
      setLoadingCaixas(false);
    }
  }, []);

  const fetchLancamentos = useCallback(async (caixaId) => {
    if (!caixaId) return;
    setLoadingLanc(true);
    try {
      const res = await fetch(`/api/lancamentos?caixaId=${caixaId}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setLancamentos(json.data || []);
    } catch (err) {
      toast.error(err.message || "Erro ao carregar lançamentos");
    } finally {
      setLoadingLanc(false);
    }
  }, []);

  const fetchMembros = useCallback(async () => {
    try {
      const res = await fetch("/api/membros-familiar");
      const json = await res.json();
      if (res.ok) setMembros(json.data || []);
    } catch {
      // silencioso
    }
  }, []);

  const fetchCategorias = useCallback(async () => {
    try {
      const res = await fetch("/api/plano-contas");
      const json = await res.json();
      if (res.ok && json.data) {
        setCategorias({
          entrada: json.data.filter((c) => c.tipo === "entrada").map((c) => c.nome),
          saida: json.data.filter((c) => c.tipo === "saida").map((c) => c.nome),
        });
      }
    } catch {
      // silencioso — mantém vazio
    }
  }, []);

  useEffect(() => {
    fetchCaixas();
    fetchMembros();
    fetchCategorias();
  }, [fetchCaixas, fetchMembros, fetchCategorias]);

  useEffect(() => {
    if (caixaSelecionado) {
      fetchLancamentos(caixaSelecionado._id);
    }
  }, [caixaSelecionado, fetchLancamentos]);

  const handleSalvarLancamento = async (e) => {
    e.preventDefault();
    if (!lancForm.categoria) {
      toast.error("Selecione uma categoria");
      return;
    }
    if (!lancForm.valor || parseFloat(lancForm.valor) <= 0) {
      toast.error("Informe um valor válido");
      return;
    }
    setSalvandoLanc(true);
    try {
      const res = await fetch("/api/lancamentos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          caixaId: caixaSelecionado._id,
          tipo: lancForm.tipo,
          categoria: lancForm.categoria,
          valor: parseFloat(lancForm.valor),
          descricao: lancForm.descricao,
          forma_pagamento: lancForm.forma_pagamento || null,
          membro_familiar:
            lancForm.categoria === "Consumo familiar"
              ? lancForm.membro_familiar || null
              : null,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      toast.success("Lançamento registrado!");
      setModalLancamento(false);
      setLancForm({
        tipo: "entrada",
        categoria: "",
        valor: "",
        descricao: "",
        forma_pagamento: "",
        membro_familiar: "",
      });
      fetchLancamentos(caixaSelecionado._id);
    } catch (err) {
      toast.error(err.message || "Erro ao salvar lançamento");
    } finally {
      setSalvandoLanc(false);
    }
  };

  const handleDeletar = async (id) => {
    setDeletandoId(id);
    try {
      const res = await fetch(`/api/lancamentos/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      toast.success("Lançamento removido");
      setLancamentos((prev) => prev.filter((l) => l._id !== id));
    } catch (err) {
      toast.error(err.message || "Erro ao remover");
    } finally {
      setDeletandoId(null);
    }
  };

  const totalEntradas = lancamentos
    .filter((l) => l.tipo === "entrada")
    .reduce((acc, l) => acc + l.valor, 0);

  const totalSaidas = lancamentos
    .filter((l) => l.tipo === "saida")
    .reduce((acc, l) => acc + l.valor, 0);

  const categoriasDisponiveis =
    lancForm.tipo === "entrada" ? categorias.entrada : categorias.saida;

  const caixaAberto = caixaSelecionado?.status === "aberto";

  if (loadingCaixas) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full rounded-xl" />
        <Skeleton className="h-48 w-full rounded-2xl" />
      </div>
    );
  }

  if (caixas.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-card p-8 text-center">
        <p className="text-sm text-muted-foreground">Nenhum caixa encontrado</p>
      </div>
    );
  }

  return (
    <div data-id="lancamentos-page" className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-foreground">Lançamentos</h1>
        {caixaAberto && (
          <Button
            data-id="add-lancamento-button"
            onClick={() => setModalLancamento(true)}
            className="bg-primary text-primary-foreground"
            size="sm"
          >
            <Plus className="h-4 w-4 mr-1" />
            Lançamento
          </Button>
        )}
      </div>

      {/* Seletor de caixa */}
      <div className="space-y-2">
        <Label>Caixa</Label>
        <div className="relative">
          <select
            value={caixaSelecionado?._id || ""}
            onChange={(e) => {
              const c = caixas.find((cx) => cx._id === e.target.value);
              setCaixaSelecionado(c || null);
            }}
            className="w-full h-10 rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring appearance-none pr-8"
          >
            {caixas.map((c) => (
              <option key={c._id} value={c._id}>
                {formatDataBR(c.data)} — {c.status === "aberto" ? "Aberto" : "Fechado"}{" "}
                (E: R$ {formatPrice(c.totais?.entradas || 0)} / S: R${" "}
                {formatPrice(c.totais?.saidas || 0)})
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        </div>
      </div>

      {/* Subtotais */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-green-500/20 bg-green-500/5 p-3">
          <div className="flex items-center gap-1 mb-1">
            <TrendingUp className="h-3 w-3 text-green-600" />
            <p className="text-xs text-green-600">Entradas</p>
          </div>
          <p className="font-semibold text-green-600 text-sm">
            R$ {formatPrice(totalEntradas)}
          </p>
        </div>
        <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-3">
          <div className="flex items-center gap-1 mb-1">
            <TrendingDown className="h-3 w-3 text-red-500" />
            <p className="text-xs text-red-500">Saídas</p>
          </div>
          <p className="font-semibold text-red-500 text-sm">
            R$ {formatPrice(totalSaidas)}
          </p>
        </div>
      </div>

      {/* Lista */}
      {loadingLanc ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full rounded-2xl" />
          ))}
        </div>
      ) : lancamentos.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-8 text-center">
          <p className="text-sm text-muted-foreground">
            Nenhum lançamento neste caixa
          </p>
        </div>
      ) : (
        <div data-id="lancamentos-list" className="space-y-2">
          {lancamentos.map((lanc) => (
            <div
              key={lanc._id}
              data-id={`lancamento-item-${lanc._id}`}
              className="rounded-2xl border border-border bg-card p-4 flex items-center gap-3"
            >
              <div
                className={`h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  lanc.tipo === "entrada" ? "bg-green-500/10" : "bg-red-500/10"
                }`}
              >
                {lanc.tipo === "entrada" ? (
                  <TrendingUp className="h-4 w-4 text-green-600" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-500" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {lanc.categoria}
                </p>
                {lanc.descricao && (
                  <p className="text-xs text-muted-foreground truncate">
                    {lanc.descricao}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  {formatHoraBR(lanc.data)}
                  {lanc.forma_pagamento && ` · ${lanc.forma_pagamento}`}
                  {lanc.membro_familiar && ` · ${lanc.membro_familiar}`}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <p
                  className={`text-sm font-semibold ${
                    lanc.tipo === "entrada" ? "text-green-600" : "text-red-500"
                  }`}
                >
                  {lanc.tipo === "entrada" ? "+" : "-"}R$ {formatPrice(lanc.valor)}
                </p>
                {caixaAberto && (
                  <button
                    onClick={() => handleDeletar(lanc._id)}
                    disabled={deletandoId === lanc._id}
                    className="text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Resultado */}
      {lancamentos.length > 0 && (
        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="flex justify-between text-sm font-semibold">
            <span className="text-muted-foreground">Resultado do caixa</span>
            <span
              className={
                totalEntradas - totalSaidas >= 0 ? "text-green-600" : "text-red-500"
              }
            >
              R$ {formatPrice(totalEntradas - totalSaidas)}
            </span>
          </div>
        </div>
      )}

      {/* Modal Novo Lançamento */}
      <Dialog open={modalLancamento} onOpenChange={setModalLancamento}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Lançamento</DialogTitle>
          </DialogHeader>
          <form data-id="lancamento-form" onSubmit={handleSalvarLancamento} className="space-y-4 pt-2">
            {/* Toggle Tipo */}
            <div className="flex rounded-xl overflow-hidden border border-border">
              <button
                type="button"
                onClick={() =>
                  setLancForm((f) => ({ ...f, tipo: "entrada", categoria: "" }))
                }
                className={`flex-1 py-2 text-sm font-medium transition-colors ${
                  lancForm.tipo === "entrada"
                    ? "bg-green-500 text-white"
                    : "bg-card text-muted-foreground hover:text-foreground"
                }`}
              >
                Entrada
              </button>
              <button
                type="button"
                onClick={() =>
                  setLancForm((f) => ({ ...f, tipo: "saida", categoria: "" }))
                }
                className={`flex-1 py-2 text-sm font-medium transition-colors ${
                  lancForm.tipo === "saida"
                    ? "bg-red-500 text-white"
                    : "bg-card text-muted-foreground hover:text-foreground"
                }`}
              >
                Saída
              </button>
            </div>

            <div className="space-y-2">
              <Label>Categoria</Label>
              <select
                value={lancForm.categoria}
                onChange={(e) =>
                  setLancForm((f) => ({ ...f, categoria: e.target.value }))
                }
                className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">Selecione...</option>
                {categoriasDisponiveis.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {lancForm.categoria === "Consumo familiar" && (
              <div className="space-y-2">
                <Label>Membro familiar</Label>
                <select
                  value={lancForm.membro_familiar}
                  onChange={(e) =>
                    setLancForm((f) => ({ ...f, membro_familiar: e.target.value }))
                  }
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">Selecione o membro...</option>
                  {membros.map((m) => (
                    <option key={m._id} value={m.nome}>
                      {m.nome}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="space-y-2">
              <Label>Valor (R$)</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                placeholder="0,00"
                value={lancForm.valor}
                onChange={(e) =>
                  setLancForm((f) => ({ ...f, valor: e.target.value }))
                }
                className="bg-background border-input"
              />
            </div>

            <div className="space-y-2">
              <Label>Forma de pagamento (opcional)</Label>
              <select
                value={lancForm.forma_pagamento}
                onChange={(e) =>
                  setLancForm((f) => ({ ...f, forma_pagamento: e.target.value }))
                }
                className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">Nenhuma</option>
                {FORMAS_PAGAMENTO.map(({ value, label }) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label>Descrição (opcional)</Label>
              <Input
                type="text"
                placeholder="Observações..."
                value={lancForm.descricao}
                onChange={(e) =>
                  setLancForm((f) => ({ ...f, descricao: e.target.value }))
                }
                className="bg-background border-input"
              />
            </div>

            <Button
              type="submit"
              disabled={salvandoLanc}
              className="w-full bg-primary text-primary-foreground"
            >
              {salvandoLanc ? "Salvando..." : "Registrar lançamento"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
