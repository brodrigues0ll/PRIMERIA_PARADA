"use client";
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Search, X, Package, AlertTriangle, ArrowUpCircle, ArrowDownCircle,
  SlidersHorizontal, Plus, Trash2, DollarSign, ShoppingCart, ArrowLeftRight,
  MapPin,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn, formatPrice } from "@/lib/utils";
import { toast } from "sonner";

// ---------- helpers ----------

function StockBadge({ quantidade, minimo }) {
  if (minimo > 0 && quantidade <= 0)
    return <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-destructive/15 text-destructive">Zerado</span>;
  if (minimo > 0 && quantidade <= minimo)
    return <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-500">Baixo</span>;
  return null;
}

function TipoIcon({ tipo }) {
  if (tipo === "entrada") return <ArrowUpCircle className="h-3.5 w-3.5 text-emerald-500" />;
  if (tipo === "saida") return <ArrowDownCircle className="h-3.5 w-3.5 text-rose-500" />;
  if (tipo === "transferencia") return <ArrowLeftRight className="h-3.5 w-3.5 text-blue-500" />;
  return <SlidersHorizontal className="h-3.5 w-3.5 text-amber-500" />;
}

const TIPOS_MOVIMENTO = [
  { key: "entrada", label: "Entrada", icon: ArrowUpCircle, color: "text-emerald-500" },
  { key: "saida", label: "Saída", icon: ArrowDownCircle, color: "text-rose-500" },
  { key: "ajuste", label: "Ajuste", icon: SlidersHorizontal, color: "text-amber-500" },
];

// ---------- MovimentoModal (existing) ----------

function MovimentoModal({ open, produto, onClose, onSuccess }) {
  const [tipo, setTipo] = useState("entrada");
  const [quantidade, setQuantidade] = useState("");
  const [observacao, setObservacao] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) { setTipo("entrada"); setQuantidade(""); setObservacao(""); }
  }, [open]);

  const atual = produto?.quantidade ?? 0;
  const qty = Number(quantidade);
  const preview = !isNaN(qty) && qty >= 0
    ? tipo === "entrada" ? atual + qty
    : tipo === "saida" ? Math.max(0, atual - qty)
    : qty
    : null;

  async function handleSave() {
    if (isNaN(qty) || qty < 0) { toast.error("Quantidade inválida"); return; }
    setLoading(true);
    try {
      const res = await fetch(`/api/produtos/${produto._id}/movimento`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tipo, quantidade: qty, observacao }),
      });
      if (!res.ok) { toast.error("Erro ao salvar"); return; }
      toast.success("Estoque atualizado");
      onSuccess?.();
      onClose();
    } catch { toast.error("Erro ao salvar"); }
    finally { setLoading(false); }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full sm:max-w-sm bg-card border border-border rounded-t-2xl sm:rounded-2xl p-6 flex flex-col gap-5">
        <div>
          <p className="text-base font-semibold text-foreground truncate">{produto?.nome}</p>
          <p className="text-sm text-muted-foreground">Estoque atual: <span className="font-semibold text-foreground">{atual} un.</span></p>
        </div>

        <div className="grid grid-cols-3 gap-1.5 bg-muted rounded-xl p-1">
          {TIPOS_MOVIMENTO.map(({ key, label, icon: Icon, color }) => (
            <button
              key={key}
              onClick={() => setTipo(key)}
              className={cn(
                "flex flex-col items-center gap-1 py-2.5 rounded-lg text-xs font-medium transition-colors",
                tipo === key ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className={cn("h-4 w-4", tipo === key ? color : "")} />
              {label}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-foreground">
            {tipo === "ajuste" ? "Nova quantidade" : "Quantidade"}
          </label>
          <Input
            type="number"
            inputMode="numeric"
            min="0"
            className="h-12 text-lg font-semibold text-center bg-background border-border"
            value={quantidade}
            onChange={(e) => setQuantidade(e.target.value)}
            placeholder="0"
            autoFocus
          />
        </div>

        {preview !== null && quantidade !== "" && (
          <div className="flex items-center justify-between rounded-xl bg-muted px-4 py-3">
            <span className="text-sm text-muted-foreground">Novo estoque</span>
            <span className="text-sm font-bold text-foreground">{preview} un.</span>
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          <label className="text-sm text-muted-foreground">Observação <span className="text-xs">(opcional)</span></label>
          <Input
            className="bg-background border-border"
            value={observacao}
            onChange={(e) => setObservacao(e.target.value)}
            placeholder="Ex: recebimento de fornecedor"
          />
        </div>

        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={onClose}>Cancelar</Button>
          <Button
            className="flex-1 bg-primary hover:bg-primary/90"
            onClick={handleSave}
            disabled={loading || quantidade === ""}
          >
            {loading ? "Salvando..." : "Confirmar"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ---------- TransferModal ----------

function TransferModal({ open, locais, produtoInicial, localOrigemId, onClose, onSuccess }) {
  const [produtoId, setProdutoId] = useState("");
  const [produtos, setProdutos] = useState([]);
  const [localDestino, setLocalDestino] = useState("");
  const [quantidade, setQuantidade] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setLocalDestino("");
      setQuantidade("");
      if (produtoInicial) {
        setProdutoId(produtoInicial._id);
      } else {
        setProdutoId("");
      }
    }
  }, [open, produtoInicial]);

  useEffect(() => {
    async function fetchProdutos() {
      try {
        const res = await fetch("/api/produtos");
        const data = await res.json();
        if (res.ok) setProdutos(data.data || []);
      } catch {}
    }
    if (open) fetchProdutos();
  }, [open]);

  const destinosDisponiveis = locais.filter((l) => l._id !== localOrigemId);

  async function handleTransferir(e) {
    e.preventDefault();
    const qty = Number(quantidade);
    if (!produtoId || !localDestino || isNaN(qty) || qty <= 0) {
      toast.error("Preencha todos os campos");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/transferencias-estoque", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          produtoId,
          localOrigemId,
          localDestinoId: localDestino,
          quantidade: qty,
        }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || "Erro ao transferir"); return; }
      toast.success("Transferência realizada!");
      onSuccess?.();
      onClose();
    } catch { toast.error("Erro ao transferir"); }
    finally { setLoading(false); }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!loading) onClose(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Transferir estoque</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleTransferir} className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Produto</label>
            <Select value={produtoId} onValueChange={setProdutoId} required>
              <SelectTrigger className="bg-background border-input">
                <SelectValue placeholder="Selecione o produto" />
              </SelectTrigger>
              <SelectContent>
                {produtos.map((p) => (
                  <SelectItem key={p._id} value={p._id}>{p.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Local de destino</label>
            <Select value={localDestino} onValueChange={setLocalDestino} required>
              <SelectTrigger className="bg-background border-input">
                <SelectValue placeholder="Selecione o destino" />
              </SelectTrigger>
              <SelectContent>
                {destinosDisponiveis.map((l) => (
                  <SelectItem key={l._id} value={l._id}>{l.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Quantidade</label>
            <Input
              type="number"
              inputMode="numeric"
              min="1"
              value={quantidade}
              onChange={(e) => setQuantidade(e.target.value)}
              placeholder="0"
              className="bg-background border-input"
              required
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button
              type="submit"
              className="bg-primary text-primary-foreground"
              disabled={loading || !produtoId || !localDestino || !quantidade}
            >
              {loading ? "Transferindo..." : "Transferir"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ---------- Main page ----------

export default function EstoquePage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // locais
  const [locais, setLocais] = useState([]);
  const [localSelecionado, setLocalSelecionado] = useState(searchParams.get("localId") || "consolidado");

  // products (full list)
  const [produtos, setProdutos] = useState([]);
  // local-specific stock
  const [estoqueLocal, setEstoqueLocal] = useState([]);

  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedProduto, setSelectedProduto] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [transferProduto, setTransferProduto] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [historico, setHistorico] = useState({});
  const [editingMinimo, setEditingMinimo] = useState(null);
  const [minimoValue, setMinimoValue] = useState("");
  const minimoInputRef = useRef(null);

  // Fetch locais on mount
  const fetchLocais = useCallback(async () => {
    try {
      const res = await fetch("/api/locais-estoque");
      const data = await res.json();
      if (res.ok) setLocais(data.data || []);
    } catch {}
  }, []);

  const fetchProdutos = useCallback(async () => {
    try {
      const res = await fetch("/api/produtos");
      const data = await res.json();
      if (res.ok) setProdutos(data.data || []);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchEstoqueLocal = useCallback(async (localId) => {
    if (!localId || localId === "consolidado") return;
    setLoading(true);
    try {
      const res = await fetch(`/api/estoque-local?localId=${localId}`);
      const data = await res.json();
      if (res.ok) setEstoqueLocal(data.data || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLocais();
    fetchProdutos();
  }, [fetchLocais, fetchProdutos]);

  useEffect(() => {
    if (localSelecionado !== "consolidado") {
      fetchEstoqueLocal(localSelecionado);
    }
  }, [localSelecionado, fetchEstoqueLocal]);

  useEffect(() => {
    if (editingMinimo && minimoInputRef.current) minimoInputRef.current.focus();
  }, [editingMinimo]);

  async function loadHistorico(produtoId) {
    if (historico[produtoId]) return;
    try {
      const res = await fetch(`/api/produtos/${produtoId}`);
      const data = await res.json();
      setHistorico((prev) => ({ ...prev, [produtoId]: data.historico }));
    } catch {}
  }

  function toggleExpand(id) {
    if (expandedId === id) { setExpandedId(null); return; }
    setExpandedId(id);
    loadHistorico(id);
  }

  function startEditMinimo(produto, e) {
    e.stopPropagation();
    setEditingMinimo(produto._id);
    setMinimoValue(String(produto.minimo));
  }

  async function saveMinimo(produto) {
    const val = parseInt(minimoValue, 10);
    setEditingMinimo(null);
    if (isNaN(val) || val < 0 || val === produto.minimo) return;
    try {
      await fetch(`/api/produtos/${produto._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ minimo: val }),
      });
      fetchProdutos();
    } catch { toast.error("Erro ao atualizar mínimo"); }
  }

  async function removerProduto(produto, e) {
    e.stopPropagation();
    if (!confirm(`Remover "${produto.nome}" do estoque?`)) return;
    try {
      const res = await fetch(`/api/produtos/${produto._id}`, { method: "DELETE" });
      if (!res.ok) { toast.error("Erro ao remover"); return; }
      toast.success(`"${produto.nome}" removido`);
      fetchProdutos();
      if (expandedId === produto._id) setExpandedId(null);
    } catch { toast.error("Erro ao remover"); }
  }

  // Build display list depending on selected tab
  const displayProdutos = useMemo(() => {
    if (localSelecionado === "consolidado") return produtos;
    // Map estoqueLocal entries to produto-like shape
    return estoqueLocal
      .filter((el) => el.produto)
      .map((el) => ({
        ...el.produto,
        quantidade: el.quantidade,
        minimo: el.minimo,
        _estoqueLocalId: el._id,
      }));
  }, [localSelecionado, produtos, estoqueLocal]);

  const filtered = useMemo(() =>
    displayProdutos.filter((p) =>
      p.nome.toLowerCase().includes(search.toLowerCase()) ||
      (p.codigo && p.codigo.includes(search))
    ),
    [displayProdutos, search]
  );

  const lowStock = useMemo(() =>
    displayProdutos.filter((p) => p.minimo > 0 && p.quantidade <= p.minimo),
    [displayProdutos]
  );

  const totalValue = useMemo(() =>
    displayProdutos.reduce((sum, p) => sum + (p.precoCompra || 0) * p.quantidade, 0),
    [displayProdutos]
  );

  const sorted = useMemo(() => [...filtered].sort((a, b) => {
    const score = (p) => {
      if (p.minimo > 0 && p.quantidade <= 0) return 0;
      if (p.minimo > 0 && p.quantidade <= p.minimo) return 1;
      return 2;
    };
    const diff = score(a) - score(b);
    return diff !== 0 ? diff : a.nome.localeCompare(b.nome, "pt-BR");
  }), [filtered]);

  function handleTabChange(val) {
    setLocalSelecionado(val);
    setSearch("");
    setExpandedId(null);
    setHistorico({});
    // update URL
    const url = new URL(window.location.href);
    if (val === "consolidado") {
      url.searchParams.delete("localId");
    } else {
      url.searchParams.set("localId", val);
    }
    router.replace(url.pathname + url.search);
  }

  function handleRefresh() {
    fetchProdutos();
    if (localSelecionado !== "consolidado") fetchEstoqueLocal(localSelecionado);
  }

  return (
    <>
      <div data-id="estoque-page" className="pb-28">
        {/* Tab bar */}
        <div data-id="estoque-header" className="sticky top-14 z-20 bg-background/90 backdrop-blur-md border-b border-border">
          <div className="flex items-center gap-1 px-4 pt-3 overflow-x-auto scrollbar-none">
            <button
              data-id="estoque-tab-consolidado"
              onClick={() => handleTabChange("consolidado")}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors shrink-0",
                localSelecionado === "consolidado"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              )}
            >
              Consolidado
            </button>
            {locais.map((local) => (
              <button
                key={local._id}
                data-id={`estoque-tab-${local._id}`}
                onClick={() => handleTabChange(local._id)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors shrink-0",
                  localSelecionado === local._id
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                )}
              >
                {local.nome}
              </button>
            ))}
            <button
              data-id="estoque-locais-link"
              onClick={() => router.push("/estoque/locais")}
              className="px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors shrink-0 text-muted-foreground hover:text-foreground hover:bg-accent flex items-center gap-1"
            >
              <MapPin className="h-3 w-3" />
              Locais
            </button>
          </div>
          <div className="px-4 py-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                data-id="estoque-search-input"
                className="pl-9 pr-9 bg-card border-border h-10"
                placeholder="Buscar produto..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="px-4 pt-2 flex flex-col gap-4">

          {/* Local header with transfer button */}
          {localSelecionado !== "consolidado" && (
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                {locais.find((l) => l._id === localSelecionado)?.nome}
              </p>
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 h-8 text-xs"
                onClick={() => { setTransferProduto(null); setTransferModalOpen(true); }}
              >
                <ArrowLeftRight className="h-3.5 w-3.5" />
                Transferir
              </Button>
            </div>
          )}

          {!loading && totalValue > 0 && (
            <div className="flex items-center gap-3 rounded-xl bg-card border border-border px-4 py-3">
              <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Valor em estoque</p>
                <p className="text-sm font-bold text-foreground tabular-nums">R$&nbsp;{formatPrice(totalValue)}</p>
              </div>
            </div>
          )}

          {!loading && lowStock.length > 0 && (
            <div className="flex items-center gap-3 rounded-xl bg-amber-500/10 border border-amber-500/20 px-4 py-3">
              <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
              <p className="text-sm text-amber-500 font-medium">
                {lowStock.length} {lowStock.length === 1 ? "item com estoque baixo" : "itens com estoque baixo"}
              </p>
            </div>
          )}

          {loading && (
            <div className="rounded-2xl border border-border overflow-hidden bg-card">
              {[...Array(6)].map((_, i) => (
                <div key={i}>
                  <div className="flex items-center justify-between px-4 py-4">
                    <div className="flex flex-col gap-1.5">
                      <Skeleton className="h-4 w-36" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                    <Skeleton className="h-7 w-16 rounded-lg" />
                  </div>
                  {i < 5 && <Separator />}
                </div>
              ))}
            </div>
          )}

          {!loading && sorted.length === 0 && (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="h-14 w-14 rounded-2xl bg-muted flex items-center justify-center mb-4">
                <Package className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-sm font-semibold text-foreground mb-1">
                {search ? "Nenhum item encontrado" : "Estoque vazio"}
              </p>
              <p className="text-xs text-muted-foreground">
                {search ? `Sem resultados para "${search}"` : "Adicione o primeiro produto"}
              </p>
            </div>
          )}

          {!loading && sorted.length > 0 && (
            <>
              <p className="text-xs text-muted-foreground px-1">
                {filtered.length} {filtered.length === 1 ? "item" : "itens"}
              </p>
              <div data-id="estoque-list" className="rounded-2xl border border-border bg-card overflow-hidden">
                {sorted.map((produto, idx) => {
                  const isExpanded = expandedId === produto._id;
                  const hist = historico[produto._id];
                  return (
                    <div key={produto._id} data-id={`estoque-item-${produto._id}`}>
                      <div className="flex items-center gap-3 px-4 py-3.5">
                        <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center overflow-hidden shrink-0">
                          {produto.imagem
                            // eslint-disable-next-line @next/next/no-img-element
                            ? <img src={produto.imagem} alt={produto.nome} className="h-full w-full object-cover" />
                            : <Package className="h-5 w-5 text-muted-foreground/40" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p data-id="estoque-item-name" className="text-sm font-medium text-foreground truncate">{produto.nome}</p>
                            <StockBadge quantidade={produto.quantidade} minimo={produto.minimo} />
                            {produto.precoVenda > 0 && (
                              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600">
                                Vendável
                              </span>
                            )}
                          </div>
                          {produto.codigo && (
                            <p className="text-xs text-muted-foreground font-mono mt-0.5">{produto.codigo}</p>
                          )}
                          {produto.precoCompra > 0 && (
                            <p className="text-xs text-muted-foreground mt-0.5">
                              Custo: R$&nbsp;{formatPrice(produto.precoCompra)}
                              {produto.precoVenda > 0 && ` · Venda: R$\u00a0${formatPrice(produto.precoVenda)}`}
                            </p>
                          )}
                          {/* Mínimo inline editável */}
                          {editingMinimo === produto._id ? (
                            <div className="flex items-center gap-1 mt-1" onClick={(e) => e.stopPropagation()}>
                              <span className="text-xs text-muted-foreground">Mín:</span>
                              <input
                                ref={minimoInputRef}
                                type="number" min="0"
                                value={minimoValue}
                                onChange={(e) => setMinimoValue(e.target.value)}
                                onBlur={() => saveMinimo(produto)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") saveMinimo(produto);
                                  if (e.key === "Escape") setEditingMinimo(null);
                                }}
                                className="w-14 h-6 text-xs px-1.5 rounded border border-primary bg-background text-foreground focus:outline-none"
                              />
                              <span className="text-xs text-muted-foreground">un.</span>
                            </div>
                          ) : (
                            <button onClick={(e) => startEditMinimo(produto, e)} className="text-left mt-0.5">
                              <p className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                                Mín: {produto.minimo} un.<span className="ml-1 text-muted-foreground/40 text-[10px]">↵</span>
                              </p>
                            </button>
                          )}
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {/* Transfer button visible when in a local tab */}
                          {localSelecionado !== "consolidado" && (
                            <button
                              onClick={() => { setTransferProduto(produto); setTransferModalOpen(true); }}
                              className="h-8 w-8 rounded-lg bg-muted hover:bg-accent flex items-center justify-center transition-colors text-muted-foreground hover:text-foreground"
                              title="Transferir"
                            >
                              <ArrowLeftRight className="h-3.5 w-3.5" />
                            </button>
                          )}
                          <button onClick={() => toggleExpand(produto._id)} className="text-right">
                            <p data-id="estoque-item-quantity" className={cn(
                              "text-xl font-bold tabular-nums leading-none",
                              produto.minimo > 0 && produto.quantidade <= 0 ? "text-destructive"
                                : produto.minimo > 0 && produto.quantidade <= produto.minimo ? "text-amber-500"
                                : "text-foreground"
                            )}>
                              {produto.quantidade}
                            </p>
                            <p className="text-xs text-muted-foreground">un.</p>
                          </button>
                          <button
                            data-id="estoque-item-edit-button"
                            onClick={() => { setSelectedProduto(produto); setModalOpen(true); }}
                            className="h-8 w-8 rounded-lg bg-muted hover:bg-accent flex items-center justify-center transition-colors text-muted-foreground hover:text-foreground text-lg font-light"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="border-t border-border bg-muted/30 px-4 py-3">
                          {!hist && <p className="text-xs text-muted-foreground py-1">Carregando...</p>}
                          {hist && hist.length === 0 && <p className="text-xs text-muted-foreground py-1">Sem movimentações</p>}
                          {hist && hist.length > 0 && (
                            <div className="flex flex-col gap-2">
                              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                                Últimas movimentações
                              </p>
                              {hist.map((mov) => (
                                <div key={mov._id} className="flex items-start gap-2">
                                  <TipoIcon tipo={mov.tipo} />
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between">
                                      <p className="text-xs font-medium text-foreground capitalize">{mov.tipo}</p>
                                      <p className="text-xs text-muted-foreground">{mov.quantidadeAnterior} → {mov.quantidadeNova}</p>
                                    </div>
                                    {mov.observacao && <p className="text-xs text-muted-foreground truncate">{mov.observacao}</p>}
                                    <p className="text-xs text-muted-foreground/60">
                                      {new Date(mov.createdAt).toLocaleDateString("pt-BR", {
                                        day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit",
                                      })}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                          <button
                            data-id="estoque-item-delete-button"
                            onClick={(e) => removerProduto(produto, e)}
                            className="mt-3 flex items-center gap-1.5 text-xs text-destructive/70 hover:text-destructive transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Remover do estoque
                          </button>
                        </div>
                      )}

                      {idx < sorted.length - 1 && <Separator />}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="fixed bottom-6 right-5 z-30">
        <Button
          data-id="add-product-button"
          size="icon"
          className="h-14 w-14 rounded-2xl bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25"
          onClick={() => router.push("/estoque/adicionar")}
        >
          <Plus className="h-6 w-6" />
        </Button>
      </div>

      <MovimentoModal
        open={modalOpen}
        produto={selectedProduto}
        onClose={() => setModalOpen(false)}
        onSuccess={() => {
          handleRefresh();
          if (expandedId === selectedProduto?._id) {
            setHistorico((prev) => { const next = { ...prev }; delete next[selectedProduto._id]; return next; });
            loadHistorico(selectedProduto._id);
          }
        }}
      />

      <TransferModal
        open={transferModalOpen}
        locais={locais}
        produtoInicial={transferProduto}
        localOrigemId={localSelecionado !== "consolidado" ? localSelecionado : null}
        onClose={() => setTransferModalOpen(false)}
        onSuccess={handleRefresh}
      />
    </>
  );
}
