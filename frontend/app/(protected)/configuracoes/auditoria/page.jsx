"use client";
import { useState, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { ChevronLeft, ChevronRight, Search, X, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const ACOES_LABELS = {
  "caixa.abrir": "Abriu caixa",
  "caixa.fechar": "Fechou caixa",
  "lancamento.criar": "Criou lançamento",
  "lancamento.deletar": "Deletou lançamento",
  "comanda.fechar": "Fechou comanda",
  "comanda.reabrir": "Reabriu comanda",
  "delivery.cancelar": "Cancelou delivery",
  "delivery.entregar": "Entregou delivery",
  "produto.preco.alterar": "Alterou preço",
  "produto.deletar": "Deletou produto",
  "senha.alterar": "Alterou senha",
  "funcionario.criar": "Criou funcionário",
  "funcionario.desativar": "Desativou funcionário",
};

const ENTIDADES = ["", "CaixaDiario", "Comanda", "LancamentoFinanceiro", "PedidoDelivery", "Produto", "User"];

function AcaoBadge({ acao }) {
  const color =
    acao.includes("deletar") || acao.includes("cancelar") || acao.includes("desativar")
      ? "bg-destructive/10 text-destructive"
      : acao.includes("criar") || acao.includes("abrir")
      ? "bg-green-500/10 text-green-600"
      : "bg-primary/10 text-primary";
  return (
    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${color}`}>
      {ACOES_LABELS[acao] ?? acao}
    </span>
  );
}

function LogRow({ log }) {
  const [expanded, setExpanded] = useState(false);
  const nome = log.usuario?.name ?? log.usuario?.email ?? "—";
  const data = log.createdAt
    ? format(new Date(log.createdAt), "dd/MM/yy HH:mm", { locale: ptBR })
    : "—";

  return (
    <div>
      <button
        className="w-full text-left px-4 py-3 hover:bg-muted/40 transition-colors"
        onClick={() => setExpanded((v) => !v)}
        data-id={`audit-log-${log._id}`}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <AcaoBadge acao={log.acao} />
              {log.entidade && (
                <span className="text-[10px] text-muted-foreground">{log.entidade}</span>
              )}
            </div>
            <p className="text-sm text-foreground mt-1 truncate">{nome}</p>
          </div>
          <p className="text-xs text-muted-foreground shrink-0">{data}</p>
        </div>
      </button>
      {expanded && log.dados && (
        <div className="px-4 pb-3">
          <pre className="text-[11px] text-muted-foreground bg-muted/30 rounded-lg p-3 overflow-x-auto whitespace-pre-wrap break-all">
            {JSON.stringify(log.dados, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

export default function AuditoriaPage() {
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const [filtroAcao, setFiltroAcao] = useState("");
  const [filtroEntidade, setFiltroEntidade] = useState("");
  const [filtroInicio, setFiltroInicio] = useState("");
  const [filtroFim, setFiltroFim] = useState("");

  const fetchLogs = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: p, limit: 50 });
      if (filtroAcao) params.set("acao", filtroAcao);
      if (filtroEntidade) params.set("entidade", filtroEntidade);
      if (filtroInicio) params.set("dataInicio", filtroInicio);
      if (filtroFim) params.set("dataFim", filtroFim);

      const res = await fetch(`/api/auditoria?${params}`);
      const data = await res.json();
      setLogs(data.logs ?? []);
      setTotal(data.total ?? 0);
      setPages(data.pages ?? 1);
      setPage(data.page ?? 1);
    } finally {
      setLoading(false);
    }
  }, [filtroAcao, filtroEntidade, filtroInicio, filtroFim]);

  useEffect(() => { fetchLogs(1); }, [fetchLogs]);

  function clearFiltros() {
    setFiltroAcao("");
    setFiltroEntidade("");
    setFiltroInicio("");
    setFiltroFim("");
  }

  const hasFilters = filtroAcao || filtroEntidade || filtroInicio || filtroFim;

  return (
    <div className="space-y-4" data-id="auditoria-section">
      {/* Filtros */}
      <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-foreground">Filtros</p>
          {hasFilters && (
            <button
              onClick={clearFiltros}
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
            >
              <X className="h-3 w-3" /> Limpar
            </button>
          )}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="relative col-span-2 sm:col-span-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              className="pl-8 h-8 text-xs"
              placeholder="Filtrar por ação…"
              value={filtroAcao}
              onChange={(e) => setFiltroAcao(e.target.value)}
              data-id="auditoria-filtro-acao"
            />
          </div>
          <select
            className="h-8 rounded-md border border-input bg-background px-2 text-xs text-foreground col-span-2 sm:col-span-1"
            value={filtroEntidade}
            onChange={(e) => setFiltroEntidade(e.target.value)}
            data-id="auditoria-filtro-entidade"
          >
            <option value="">Todas as entidades</option>
            {ENTIDADES.filter(Boolean).map((e) => (
              <option key={e} value={e}>{e}</option>
            ))}
          </select>
          <Input
            type="date"
            className="h-8 text-xs"
            value={filtroInicio}
            onChange={(e) => setFiltroInicio(e.target.value)}
            data-id="auditoria-filtro-inicio"
          />
          <Input
            type="date"
            className="h-8 text-xs"
            value={filtroFim}
            onChange={(e) => setFiltroFim(e.target.value)}
            data-id="auditoria-filtro-fim"
          />
        </div>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">{total} registro{total !== 1 ? "s" : ""}</p>
        <button
          onClick={() => fetchLogs(page)}
          className="text-muted-foreground hover:text-foreground transition-colors"
          data-id="auditoria-refresh"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      {/* Lista */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
        </div>
      ) : logs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-sm font-semibold text-foreground mb-1">Nenhum registro</p>
          <p className="text-xs text-muted-foreground">Tente ajustar os filtros</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-card overflow-hidden" data-id="auditoria-list">
          {logs.map((log, idx) => (
            <div key={log._id}>
              <LogRow log={log} />
              {idx < logs.length - 1 && <Separator />}
            </div>
          ))}
        </div>
      )}

      {/* Paginação */}
      {pages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1 || loading}
            onClick={() => fetchLogs(page - 1)}
            data-id="auditoria-prev"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-xs text-muted-foreground">
            Página {page} de {pages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= pages || loading}
            onClick={() => fetchLogs(page + 1)}
            data-id="auditoria-next"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
