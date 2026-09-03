"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { TrendingUp, TrendingDown, DollarSign, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { formatPrice } from "@/lib/utils";

function getInicioDia() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString().split("T")[0];
}

function getFimDia() {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d.toISOString().split("T")[0];
}

function getInicioSemana() {
  const d = new Date();
  const dia = d.getDay();
  const diff = d.getDate() - dia + (dia === 0 ? -6 : 1);
  d.setDate(diff);
  return d.toISOString().split("T")[0];
}

function getInicioMes() {
  const d = new Date();
  d.setDate(1);
  return d.toISOString().split("T")[0];
}

const PERIODOS = [
  { label: "Hoje", key: "hoje" },
  { label: "Esta semana", key: "semana" },
  { label: "Este mês", key: "mes" },
  { label: "Personalizado", key: "custom" },
];

export default function RelatoriosPage() {
  const [periodoSelecionado, setPeriodoSelecionado] = useState("mes");
  const [inicio, setInicio] = useState(getInicioMes());
  const [fim, setFim] = useState(getFimDia());
  const [loading, setLoading] = useState(false);
  const [dre, setDre] = useState(null);

  const handlePeriodo = (key) => {
    setPeriodoSelecionado(key);
    const hoje = getFimDia();
    if (key === "hoje") {
      setInicio(getInicioDia());
      setFim(hoje);
    } else if (key === "semana") {
      setInicio(getInicioSemana());
      setFim(hoje);
    } else if (key === "mes") {
      setInicio(getInicioMes());
      setFim(hoje);
    }
    // custom: não altera
  };

  const fetchDRE = useCallback(async () => {
    if (!inicio || !fim) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ inicio, fim });
      const res = await fetch(`/api/relatorios/dre?${params}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setDre(json.data);
    } catch (err) {
      toast.error(err.message || "Erro ao carregar relatório");
    } finally {
      setLoading(false);
    }
  }, [inicio, fim]);

  useEffect(() => {
    fetchDRE();
  }, [fetchDRE]);

  const maxReceita =
    dre?.receitas?.porCategoria?.reduce((acc, c) => Math.max(acc, c.total), 0) || 1;
  const maxDespesa =
    dre?.despesas?.porCategoria?.reduce((acc, c) => Math.max(acc, c.total), 0) || 1;

  const resultado = dre?.resultado ?? 0;

  return (
    <div data-id="relatorios-page" className="space-y-4">
      <h1 className="text-xl font-semibold text-foreground">Relatórios</h1>

      {/* Filtros de período */}
      <div data-id="relatorios-date-filter" className="space-y-3">
        <div className="flex gap-2 flex-wrap">
          {PERIODOS.map((p) => (
            <button
              key={p.key}
              onClick={() => handlePeriodo(p.key)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
                periodoSelecionado === p.key
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card text-muted-foreground border-border hover:text-foreground"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {periodoSelecionado === "custom" && (
          <div className="flex gap-3">
            <div className="flex-1 space-y-1">
              <Label className="text-xs">Início</Label>
              <Input
                type="date"
                value={inicio}
                onChange={(e) => setInicio(e.target.value)}
                className="bg-background border-input h-9 text-sm"
              />
            </div>
            <div className="flex-1 space-y-1">
              <Label className="text-xs">Fim</Label>
              <Input
                type="date"
                value={fim}
                onChange={(e) => setFim(e.target.value)}
                className="bg-background border-input h-9 text-sm"
              />
            </div>
          </div>
        )}
      </div>

      {loading ? (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20 rounded-2xl" />
            ))}
          </div>
          <Skeleton className="h-48 rounded-2xl" />
          <Skeleton className="h-48 rounded-2xl" />
        </div>
      ) : dre ? (
        <div className="space-y-4">
          {/* Cards principais */}
          <div data-id="relatorios-summary" className="grid grid-cols-3 gap-3">
            <div className="rounded-2xl border border-green-500/20 bg-green-500/5 p-3">
              <div className="flex items-center gap-1 mb-1">
                <TrendingUp className="h-3 w-3 text-green-600" />
                <p className="text-xs text-green-600">Receitas</p>
              </div>
              <p className="font-semibold text-green-600 text-sm">
                R$ {formatPrice(dre.receitas.total)}
              </p>
            </div>

            <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-3">
              <div className="flex items-center gap-1 mb-1">
                <TrendingDown className="h-3 w-3 text-red-500" />
                <p className="text-xs text-red-500">Despesas</p>
              </div>
              <p className="font-semibold text-red-500 text-sm">
                R$ {formatPrice(dre.despesas.total)}
              </p>
            </div>

            <div
              className={`rounded-2xl border p-3 ${
                resultado >= 0
                  ? "border-primary/20 bg-primary/5"
                  : "border-red-500/20 bg-red-500/5"
              }`}
            >
              <div className="flex items-center gap-1 mb-1">
                <DollarSign
                  className={`h-3 w-3 ${
                    resultado >= 0 ? "text-primary" : "text-red-500"
                  }`}
                />
                <p
                  className={`text-xs ${
                    resultado >= 0 ? "text-primary" : "text-red-500"
                  }`}
                >
                  Resultado
                </p>
              </div>
              <p
                className={`font-semibold text-sm ${
                  resultado >= 0 ? "text-primary" : "text-red-500"
                }`}
              >
                R$ {formatPrice(resultado)}
              </p>
            </div>
          </div>

          {/* Receitas por categoria */}
          {dre.receitas.porCategoria.length > 0 && (
            <div data-id="relatorios-receitas-chart" className="rounded-2xl border border-border bg-card p-4 space-y-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-600" />
                <h2 className="text-sm font-semibold text-foreground">
                  Receitas por categoria
                </h2>
              </div>
              <Separator />
              <div className="space-y-3">
                {dre.receitas.porCategoria
                  .sort((a, b) => b.total - a.total)
                  .map((cat) => (
                    <div key={cat.categoria} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-foreground font-medium">
                          {cat.categoria}
                        </span>
                        <span className="text-green-600 font-semibold">
                          R$ {formatPrice(cat.total)}
                        </span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-green-500 rounded-full transition-all"
                          style={{
                            width: `${Math.round((cat.total / maxReceita) * 100)}%`,
                          }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground text-right">
                        {dre.receitas.total > 0
                          ? Math.round((cat.total / dre.receitas.total) * 100)
                          : 0}
                        %
                      </p>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Despesas por categoria */}
          {dre.despesas.porCategoria.length > 0 && (
            <div data-id="relatorios-despesas-chart" className="rounded-2xl border border-border bg-card p-4 space-y-3">
              <div className="flex items-center gap-2">
                <TrendingDown className="h-4 w-4 text-red-500" />
                <h2 className="text-sm font-semibold text-foreground">
                  Despesas por categoria
                </h2>
              </div>
              <Separator />
              <div className="space-y-3">
                {dre.despesas.porCategoria
                  .sort((a, b) => b.total - a.total)
                  .map((cat) => (
                    <div key={cat.categoria} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-foreground font-medium">
                          {cat.categoria}
                        </span>
                        <span className="text-red-500 font-semibold">
                          R$ {formatPrice(cat.total)}
                        </span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-red-500 rounded-full transition-all"
                          style={{
                            width: `${Math.round((cat.total / maxDespesa) * 100)}%`,
                          }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground text-right">
                        {dre.despesas.total > 0
                          ? Math.round((cat.total / dre.despesas.total) * 100)
                          : 0}
                        %
                      </p>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Consumo familiar */}
          {dre.consumoFamiliar.total > 0 && (
            <div data-id="relatorios-consumo-familiar" className="rounded-2xl border border-border bg-card p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <h2 className="text-sm font-semibold text-foreground">
                    Consumo familiar
                  </h2>
                </div>
                <span className="text-sm font-semibold text-foreground">
                  R$ {formatPrice(dre.consumoFamiliar.total)}
                </span>
              </div>
              <Separator />
              <div className="space-y-2">
                {dre.consumoFamiliar.porMembro
                  .sort((a, b) => b.total - a.total)
                  .map((item) => (
                    <div
                      key={item.membro}
                      className="flex justify-between items-center"
                    >
                      <span className="text-sm text-foreground">{item.membro}</span>
                      <span className="text-sm font-semibold text-foreground">
                        R$ {formatPrice(item.total)}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Vazio */}
          {dre.receitas.total === 0 && dre.despesas.total === 0 && (
            <div className="rounded-2xl border border-border bg-card p-8 text-center">
              <p className="text-sm text-muted-foreground">
                Nenhum lançamento no período selecionado
              </p>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
