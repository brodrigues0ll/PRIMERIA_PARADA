"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Plus,
  Lock,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatPrice } from "@/lib/utils";

const CATEGORIAS_ENTRADA = ["Vendas salão", "Vendas delivery", "Outros"];
const CATEGORIAS_SAIDA = [
  "Compra de insumos",
  "Despesa fixa",
  "Folha de pagamento",
  "Retirada",
  "Consumo familiar",
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

function formatHoraBR(date) {
  if (!date) return "";
  return new Date(date).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function CaixaPage() {
  const [loading, setLoading] = useState(true);
  const [caixa, setCaixa] = useState(null);
  const [lancamentos, setLancamentos] = useState([]);

  // Abrir caixa
  const [saldoInicial, setSaldoInicial] = useState("");
  const [abrindo, setAbrindo] = useState(false);

  // Modal fechar caixa
  const [modalFechar, setModalFechar] = useState(false);
  const [saldoContado, setSaldoContado] = useState("");
  const [fechando, setFechando] = useState(false);

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
  const [salvandoLanc, setSalvandoLanc] = useState(false);

  // Confirmar deletar
  const [deletandoId, setDeletandoId] = useState(null);

  const fetchCaixa = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/caixa");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      const caixaData = json.data;
      setCaixa(caixaData);

      if (caixaData) {
        const resLanc = await fetch(`/api/lancamentos?caixaId=${caixaData._id}`);
        const jsonLanc = await resLanc.json();
        if (resLanc.ok) setLancamentos(jsonLanc.data || []);
      }
    } catch (err) {
      toast.error(err.message || "Erro ao carregar caixa");
    } finally {
      setLoading(false);
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

  useEffect(() => {
    fetchCaixa();
    fetchMembros();
  }, [fetchCaixa, fetchMembros]);

  const handleAbrirCaixa = async (e) => {
    e.preventDefault();
    if (!saldoInicial && saldoInicial !== "0") {
      toast.error("Informe o saldo inicial");
      return;
    }
    setAbrindo(true);
    try {
      const res = await fetch("/api/caixa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ saldo_inicial: parseFloat(saldoInicial) }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      toast.success("Caixa aberto com sucesso!");
      setSaldoInicial("");
      await fetchCaixa();
    } catch (err) {
      toast.error(err.message || "Erro ao abrir caixa");
    } finally {
      setAbrindo(false);
    }
  };

  const handleFecharCaixa = async () => {
    if (saldoContado === "") {
      toast.error("Informe o saldo contado");
      return;
    }
    setFechando(true);
    try {
      const res = await fetch(`/api/caixa/${caixa._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "fechar",
          saldo_final: parseFloat(saldoContado),
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      toast.success("Caixa fechado com sucesso!");
      setModalFechar(false);
      setSaldoContado("");
      await fetchCaixa();
    } catch (err) {
      toast.error(err.message || "Erro ao fechar caixa");
    } finally {
      setFechando(false);
    }
  };

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
          caixaId: caixa._id,
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
      await fetchCaixa();
    } catch (err) {
      toast.error(err.message || "Erro ao salvar lançamento");
    } finally {
      setSalvandoLanc(false);
    }
  };

  const handleDeletarLancamento = async (id) => {
    setDeletandoId(id);
    try {
      const res = await fetch(`/api/lancamentos/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      toast.success("Lançamento removido");
      setLancamentos((prev) => prev.filter((l) => l._id !== id));
    } catch (err) {
      toast.error(err.message || "Erro ao remover lançamento");
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

  const saldoAtual = (caixa?.saldo_inicial || 0) + totalEntradas - totalSaidas;

  const categoriasDisponiveis =
    lancForm.tipo === "entrada" ? CATEGORIAS_ENTRADA : CATEGORIAS_SAIDA;

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48 rounded-lg" />
        <Skeleton className="h-32 w-full rounded-2xl" />
        <Skeleton className="h-48 w-full rounded-2xl" />
      </div>
    );
  }

  // Sem caixa hoje
  if (!caixa) {
    return (
      <div className="max-w-md mx-auto space-y-6">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Caixa do Dia</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {new Date().toLocaleDateString("pt-BR", {
              weekday: "long",
              day: "2-digit",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-medium text-foreground">Abrir caixa</p>
              <p className="text-xs text-muted-foreground">Nenhum caixa aberto hoje</p>
            </div>
          </div>

          <Separator />

          <form onSubmit={handleAbrirCaixa} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="saldo_inicial">Saldo inicial (R$)</Label>
              <Input
                id="saldo_inicial"
                type="number"
                min="0"
                step="0.01"
                placeholder="0,00"
                value={saldoInicial}
                onChange={(e) => setSaldoInicial(e.target.value)}
                className="bg-background border-input"
              />
            </div>
            <Button
              type="submit"
              disabled={abrindo}
              className="w-full bg-primary text-primary-foreground"
            >
              {abrindo ? "Abrindo..." : "Abrir caixa"}
            </Button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Caixa do Dia</h1>
          <p className="text-sm text-muted-foreground">
            {formatDataBR(caixa.data)}
          </p>
        </div>
        <Badge
          variant="outline"
          className={
            caixa.status === "aberto"
              ? "border-green-500 text-green-600"
              : "border-muted-foreground text-muted-foreground"
          }
        >
          {caixa.status === "aberto" ? "Aberto" : "Fechado"}
        </Badge>
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground mb-1">Saldo Inicial</p>
          <p className="font-semibold text-foreground">
            R$ {formatPrice(caixa.saldo_inicial)}
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground mb-1">Saldo Atual</p>
          <p
            className={`font-semibold ${
              saldoAtual >= 0 ? "text-green-600" : "text-red-500"
            }`}
          >
            R$ {formatPrice(saldoAtual)}
          </p>
        </div>
        <div className="rounded-2xl border border-green-500/20 bg-green-500/5 p-4">
          <div className="flex items-center gap-1 mb-1">
            <TrendingUp className="h-3 w-3 text-green-600" />
            <p className="text-xs text-green-600">Entradas</p>
          </div>
          <p className="font-semibold text-green-600">
            R$ {formatPrice(totalEntradas)}
          </p>
        </div>
        <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-4">
          <div className="flex items-center gap-1 mb-1">
            <TrendingDown className="h-3 w-3 text-red-500" />
            <p className="text-xs text-red-500">Saídas</p>
          </div>
          <p className="font-semibold text-red-500">
            R$ {formatPrice(totalSaidas)}
          </p>
        </div>
      </div>

      {caixa.status === "fechado" && caixa.saldo_final !== null && (
        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground mb-1">Saldo Final Contado</p>
          <p className="font-semibold text-foreground">
            R$ {formatPrice(caixa.saldo_final)}
          </p>
          {caixa.observacoes && (
            <p className="text-xs text-muted-foreground mt-2">{caixa.observacoes}</p>
          )}
        </div>
      )}

      {/* Ações */}
      {caixa.status === "aberto" && (
        <div className="flex gap-3">
          <Button
            onClick={() => setModalLancamento(true)}
            className="flex-1 bg-primary text-primary-foreground"
          >
            <Plus className="h-4 w-4 mr-2" />
            Lançamento
          </Button>
          <Button
            variant="outline"
            onClick={() => setModalFechar(true)}
            className="flex-1"
          >
            <Lock className="h-4 w-4 mr-2" />
            Fechar caixa
          </Button>
        </div>
      )}

      {/* Lista de lançamentos */}
      <div className="space-y-2">
        <h2 className="text-sm font-semibold text-foreground">
          Lançamentos ({lancamentos.length})
        </h2>

        {lancamentos.length === 0 && (
          <div className="rounded-2xl border border-border bg-card p-8 text-center">
            <p className="text-sm text-muted-foreground">
              Nenhum lançamento registrado
            </p>
          </div>
        )}

        {lancamentos.map((lanc) => (
          <div
            key={lanc._id}
            className="rounded-2xl border border-border bg-card p-4 flex items-center gap-3"
          >
            <div
              className={`h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                lanc.tipo === "entrada"
                  ? "bg-green-500/10"
                  : "bg-red-500/10"
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
              {caixa.status === "aberto" && (
                <button
                  onClick={() => handleDeletarLancamento(lanc._id)}
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

      {/* Modal Fechar Caixa */}
      <Dialog open={modalFechar} onOpenChange={setModalFechar}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Fechar Caixa</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="rounded-xl bg-muted/50 p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Saldo inicial</span>
                <span>R$ {formatPrice(caixa.saldo_inicial)}</span>
              </div>
              <div className="flex justify-between text-green-600">
                <span>+ Entradas</span>
                <span>R$ {formatPrice(totalEntradas)}</span>
              </div>
              <div className="flex justify-between text-red-500">
                <span>- Saídas</span>
                <span>R$ {formatPrice(totalSaidas)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-semibold">
                <span>Saldo esperado</span>
                <span>R$ {formatPrice(saldoAtual)}</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="saldo_contado">Saldo contado (R$)</Label>
              <Input
                id="saldo_contado"
                type="number"
                min="0"
                step="0.01"
                placeholder="0,00"
                value={saldoContado}
                onChange={(e) => setSaldoContado(e.target.value)}
                className="bg-background border-input"
              />
              {saldoContado !== "" && (
                <p
                  className={`text-xs ${
                    parseFloat(saldoContado) - saldoAtual >= 0
                      ? "text-green-600"
                      : "text-red-500"
                  }`}
                >
                  Diferença: R${" "}
                  {formatPrice(parseFloat(saldoContado) - saldoAtual)}
                </p>
              )}
            </div>

            <Button
              onClick={handleFecharCaixa}
              disabled={fechando}
              className="w-full bg-primary text-primary-foreground"
            >
              {fechando ? "Fechando..." : "Confirmar fechamento"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Novo Lançamento */}
      <Dialog open={modalLancamento} onOpenChange={setModalLancamento}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Lançamento</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSalvarLancamento} className="space-y-4 pt-2">
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

            {/* Categoria */}
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

            {/* Membro familiar */}
            {lancForm.categoria === "Consumo familiar" && (
              <div className="space-y-2">
                <Label>Membro familiar</Label>
                <select
                  value={lancForm.membro_familiar}
                  onChange={(e) =>
                    setLancForm((f) => ({
                      ...f,
                      membro_familiar: e.target.value,
                    }))
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

            {/* Valor */}
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

            {/* Forma de pagamento */}
            <div className="space-y-2">
              <Label>Forma de pagamento (opcional)</Label>
              <select
                value={lancForm.forma_pagamento}
                onChange={(e) =>
                  setLancForm((f) => ({
                    ...f,
                    forma_pagamento: e.target.value,
                  }))
                }
                className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">Nenhuma</option>
                <option value="dinheiro">Dinheiro</option>
                <option value="pix">Pix</option>
                <option value="cartao">Cartão</option>
              </select>
            </div>

            {/* Descrição */}
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
