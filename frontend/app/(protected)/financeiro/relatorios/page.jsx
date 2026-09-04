"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { TrendingUp, TrendingDown, DollarSign, Users, ShoppingBag, Store, Package, AlertTriangle, XCircle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { formatPrice } from "@/lib/utils";

const CANAL_LABEL = { comanda: "Salão", delivery: "Delivery", pdv: "PDV", manual: "Manual" };
const CANAL_COLOR = { comanda: "bg-blue-500", delivery: "bg-orange-500", pdv: "bg-violet-500", manual: "bg-gray-400" };

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
  const [topProdutos, setTopProdutos] = useState([]);
  const [estoque, setEstoque] = useState(null);
  const [loadingEstoque, setLoadingEstoque] = useState(false);

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
      const [dreRes, prodRes] = await Promise.all([
        fetch(`/api/relatorios/dre?${params}`),
        fetch(`/api/relatorios/produtos-mais-vendidos?${params}&limite=10`),
      ]);
      const dreJson = await dreRes.json();
      if (!dreRes.ok) throw new Error(dreJson.error);
      setDre(dreJson.data);
      if (prodRes.ok) {
        const prodJson = await prodRes.json();
        setTopProdutos(prodJson.data ?? []);
      }
    } catch (err) {
      toast.error(err.message || "Erro ao carregar relatório");
    } finally {
      setLoading(false);
    }
  }, [inicio, fim]);

  const fetchEstoque = useCallback(async () => {
    setLoadingEstoque(true);
    try {
      const res = await fetch("/api/relatorios/estoque");
      const json = await res.json();
      if (res.ok) setEstoque(json.data);
    } catch {
      // silencioso
    } finally {
      setLoadingEstoque(false);
    }
  }, []);

  useEffect(() => {
    fetchDRE();
    fetchEstoque();
  }, [fetchDRE, fetchEstoque]);

  const maxReceita =
    dre?.receitas?.porCategoria?.reduce((acc, c) => Math.max(acc, c.total), 0) || 1;
  const maxDespesa =
    dre?.despesas?.porCategoria?.reduce((acc, c) => Math.max(acc, c.total), 0) || 1;

  const resultado = dre?.resultado ?? 0;

  return (
    <div data-id="relatorios-page" className="space-y-4">
      <h1 className="text-xl font-semibold text-foreground">Relatórios</h1>

      <Tabs defaultValue="financeiro">
        <TabsList className="w-full grid grid-cols-2">
          <TabsTrigger value="financeiro">Financeiro</TabsTrigger>
          <TabsTrigger value="estoque">Estoque</TabsTrigger>
        </TabsList>

        <TabsContent value="financeiro" className="space-y-4 mt-4">
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

          {/* Receitas por canal */}
          {dre.receitas.porCanal && Object.keys(dre.receitas.porCanal).length > 0 && (
            <div data-id="relatorios-canal-chart" className="rounded-2xl border border-border bg-card p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Store className="h-4 w-4 text-blue-500" />
                <h2 className="text-sm font-semibold text-foreground">Receitas por canal</h2>
              </div>
              <Separator />
              <div className="space-y-3">
                {Object.entries(dre.receitas.porCanal)
                  .sort(([, a], [, b]) => b - a)
                  .map(([canal, total]) => {
                    const pct = dre.receitas.total > 0 ? Math.round((total / dre.receitas.total) * 100) : 0;
                    return (
                      <div key={canal} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-foreground font-medium">{CANAL_LABEL[canal] ?? canal}</span>
                          <span className="text-foreground font-semibold">R$ {formatPrice(total)}</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${CANAL_COLOR[canal] ?? "bg-primary"}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground text-right">{pct}%</p>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* Produtos mais vendidos */}
          {topProdutos.length > 0 && (
            <div data-id="relatorios-top-produtos" className="rounded-2xl border border-border bg-card p-4 space-y-3">
              <div className="flex items-center gap-2">
                <ShoppingBag className="h-4 w-4 text-violet-500" />
                <h2 className="text-sm font-semibold text-foreground">Produtos mais vendidos</h2>
              </div>
              <Separator />
              <div className="space-y-2">
                {topProdutos.map((prod, i) => (
                  <div key={prod.nome} className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground w-5 text-right">{i + 1}.</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-foreground truncate">{prod.nome}</p>
                    </div>
                    <div className="flex flex-col items-end shrink-0">
                      <span className="text-xs font-bold text-foreground">{prod.quantidade}x</span>
                      <span className="text-[10px] text-muted-foreground">R$ {formatPrice(prod.receita)}</span>
                    </div>
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
        </TabsContent>

        {/* ── Aba Estoque ── */}
        <TabsContent value="estoque" className="space-y-4 mt-4">
          {loadingEstoque ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 rounded-2xl" />)}
            </div>
          ) : estoque ? (
            <>
              {/* Cards resumo */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-border bg-card p-3 col-span-2">
                  <p className="text-xs text-muted-foreground mb-1">Valor total em custo</p>
                  <p className="text-lg font-bold text-foreground">R$ {formatPrice(estoque.resumo.valorTotalCusto)}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{estoque.resumo.total} produtos cadastrados</p>
                </div>
                <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <XCircle className="h-3.5 w-3.5 text-red-500" />
                    <p className="text-xs text-red-500">Zerados</p>
                  </div>
                  <p className="text-lg font-bold text-red-500">{estoque.resumo.zerados}</p>
                </div>
                <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                    <p className="text-xs text-amber-500">Abaixo do mínimo</p>
                  </div>
                  <p className="text-lg font-bold text-amber-500">{estoque.resumo.abaixoMinimo}</p>
                </div>
              </div>

              {/* Produtos zerados */}
              {estoque.zerados.length > 0 && (
                <div className="rounded-2xl border border-red-500/20 bg-card p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-red-500" />
                    <h2 className="text-sm font-semibold text-foreground">Produtos zerados ({estoque.zerados.length})</h2>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    {estoque.zerados.map((p) => (
                      <div key={p.produtoId} className="flex items-center justify-between text-xs">
                        <span className="text-foreground font-medium">{p.nome}</span>
                        <span className="text-red-500 font-bold">0 {p.unidade}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Produtos abaixo do mínimo */}
              {estoque.abaixoMinimo.length > 0 && (
                <div className="rounded-2xl border border-amber-500/20 bg-card p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                    <h2 className="text-sm font-semibold text-foreground">Abaixo do mínimo ({estoque.abaixoMinimo.length})</h2>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    {estoque.abaixoMinimo.map((p) => (
                      <div key={p.produtoId} className="flex items-center justify-between text-xs">
                        <span className="text-foreground font-medium">{p.nome}</span>
                        <div className="text-right">
                          <span className="text-amber-500 font-bold">{p.quantidade} {p.unidade}</span>
                          <span className="text-muted-foreground ml-1">(mín: {p.minimo})</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {estoque.resumo.zerados === 0 && estoque.resumo.abaixoMinimo === 0 && (
                <div className="rounded-2xl border border-border bg-card p-8 text-center">
                  <Package className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Estoque em dia — nenhum produto zerado ou abaixo do mínimo</p>
                </div>
              )}
            </>
          ) : null}
        </TabsContent>
      </Tabs>
    </div>
  );
}
