"use client";
import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { Plus, Minus, ChevronDown, ShoppingCart, X, CheckCircle2, AlertCircle, Trash2, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import BarcodeScanner from "@/components/BarcodeScanner";
import { formatPrice, cn } from "@/lib/utils";
import { FORMAS_PAGAMENTO } from "@/lib/constants/financeiro";

// ─── Seletor de comanda ──────────────────────────────────────────────
function ComandaSelector({ open, onClose, onSelect }) {
  const [comandas, setComandas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [nome, setNome] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    fetch("/api/comandas?status=aberta")
      .then((r) => r.json())
      .then((d) => { if (d.data) setComandas(d.data); })
      .finally(() => setLoading(false));
  }, [open]);

  async function handleCreate(e) {
    e.preventDefault();
    if (!nome.trim()) return;
    setCreating(true);
    try {
      const res = await fetch("/api/comandas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome: nome.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error("Erro ao criar comanda"); return; }
      setNome("");
      onSelect(data.data);
    } finally {
      setCreating(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent data-id="pdv-comanda-selector-modal" className="bg-card border-border sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Selecionar comanda</DialogTitle>
        </DialogHeader>
        {loading && (
          <div className="flex flex-col gap-2">
            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-xl" />)}
          </div>
        )}
        {!loading && comandas.length > 0 && (
          <div data-id="pdv-comanda-list" className="rounded-xl border border-border overflow-hidden">
            {comandas.map((c, i) => (
              <div data-id={`pdv-comanda-item-${c._id}`} key={c._id}>
                <button
                  onClick={() => onSelect(c)}
                  className="w-full text-left px-4 py-3 hover:bg-accent transition-colors"
                >
                  <p className="text-sm font-medium text-foreground">{c.nome}</p>
                </button>
                {i < comandas.length - 1 && <Separator />}
              </div>
            ))}
          </div>
        )}
        <form data-id="pdv-create-comanda-form" onSubmit={handleCreate} className="flex gap-2 pt-1">
          <Input
            data-id="pdv-create-comanda-input"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Nome da nova comanda"
            className="flex-1 bg-background border-border"
            autoFocus
          />
          <Button data-id="pdv-create-comanda-button" type="submit" disabled={creating || !nome.trim()} className="bg-primary hover:bg-primary/90 shrink-0">
            {creating ? "..." : "Criar"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Feedback de scan ────────────────────────────────────────────────
function ScanFeedback({ feedback, onDismiss }) {
  if (!feedback) return null;
  return (
    <div className={cn(
      "mx-4 mb-3 rounded-xl px-4 py-3 flex items-center gap-3",
      feedback.ok
        ? "bg-emerald-500/10 border border-emerald-500/20"
        : "bg-destructive/10 border border-destructive/20"
    )}>
      {feedback.ok
        ? <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
        : <AlertCircle className="h-5 w-5 text-destructive shrink-0" />}
      <div className="flex-1 min-w-0">
        <p className={cn("text-sm font-semibold truncate", feedback.ok ? "text-emerald-500" : "text-destructive")}>
          {feedback.nome}
        </p>
        {feedback.ok && feedback.preco != null
          ? <p className="text-xs text-emerald-500/70 tabular-nums">R$&nbsp;{formatPrice(feedback.preco)}</p>
          : <p className="text-xs text-destructive/70">{feedback.erro ?? "Produto não encontrado"}</p>}
      </div>
      <button onClick={onDismiss} className="text-muted-foreground hover:text-foreground shrink-0">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

// ─── Lista de itens ──────────────────────────────────────────────────
function ItemList({ items, onIncrement, onDecrement, mutating, nivelMap }) {
  if (items.length === 0) return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="h-14 w-14 rounded-2xl bg-muted flex items-center justify-center mb-4">
        <ShoppingCart className="h-6 w-6 text-muted-foreground" />
      </div>
      <p className="text-sm font-semibold text-foreground mb-1">Carrinho vazio</p>
      <p className="text-xs text-muted-foreground">Escaneie um produto para começar</p>
    </div>
  );

  return (
    <div className="px-4">
      <div data-id="pdv-product-list" className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="px-4 py-2.5 border-b border-border flex items-center justify-between">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Carrinho</p>
          <p className="text-xs text-muted-foreground">
            {items.reduce((a, p) => a + p.quantidade, 0)} itens
          </p>
        </div>
        {[...items].reverse().map((p, i) => {
          const nivel = nivelMap ? nivelMap[p.menuItemId ?? p._id] : undefined;
          return (
            <div data-id={`pdv-product-${p._id ?? p.produtoId}`} key={p._id ?? p.produtoId}>
              <div className="flex items-center gap-3 px-4 py-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-medium text-foreground truncate">{p.nome}</p>
                    {nivel && <NivelBadge nivel={nivel} />}
                  </div>
                  <p className="text-xs text-muted-foreground tabular-nums mt-0.5">
                    R$&nbsp;{formatPrice(p.preco)} × {p.quantidade}
                    <span className="text-foreground/70 font-semibold ml-2">
                      R$&nbsp;{formatPrice(p.preco * p.quantidade)}
                    </span>
                  </p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    data-id={`pdv-product-decrement-${p._id ?? p.produtoId}`}
                    onClick={() => onDecrement(p)}
                    disabled={mutating === (p._id ?? p.produtoId)}
                    className="h-7 w-7 rounded-lg border border-border flex items-center justify-center hover:bg-accent disabled:opacity-40 transition-colors"
                  >
                    <Minus className="h-3 w-3" />
                  </button>
                  <span className="text-sm font-bold w-5 text-center tabular-nums">{p.quantidade}</span>
                  <button
                    data-id={`pdv-product-increment-${p._id ?? p.produtoId}`}
                    onClick={() => onIncrement(p)}
                    disabled={mutating === (p._id ?? p.produtoId)}
                    className="h-7 w-7 rounded-lg border border-border flex items-center justify-center hover:bg-accent disabled:opacity-40 transition-colors"
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                </div>
              </div>
              {i < items.length - 1 && <Separator />}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Dialog de forma de pagamento (reutilizável) ────────────────────
function PagamentoDialog({ open, onClose, total, onConfirm, loading }) {
  const [forma, setForma] = useState("dinheiro");
  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent data-id="pdv-pagamento-dialog" className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Forma de pagamento</DialogTitle>
        </DialogHeader>
        <div className="py-2">
          <p className="text-sm text-muted-foreground mb-4">
            Total: <span className="font-bold text-foreground">R$&nbsp;{formatPrice(total)}</span>
          </p>
          <div className="grid grid-cols-2 gap-2">
            {FORMAS_PAGAMENTO.map(({ value, label }) => (
              <button
                key={value}
                data-id={`pdv-payment-option-${value}`}
                onClick={() => setForma(value)}
                className={cn(
                  "px-3 py-2.5 rounded-xl border text-sm font-medium transition-colors text-left",
                  forma === value
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-card hover:bg-accent"
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={() => onConfirm(forma)} disabled={loading}>
            <CheckCircle className="h-4 w-4 mr-1.5" />
            Confirmar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Grid de itens vendáveis ─────────────────────────────────────────
function ItensVendaveisGrid({ onSelect }) {
  const [itens, setItens] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/cardapio?vendavel=true")
      .then((r) => r.json())
      .then((d) => setItens(Array.isArray(d.data) ? d.data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Separa pratos (sem categoria ou categoria que não seja "bebida") de bebidas
  // Agrupa por categoria
  const grouped = useMemo(() => {
    const map = {};
    for (const item of itens) {
      const catId = item.categoria?._id || "sem-categoria";
      if (!map[catId]) {
        map[catId] = { cat: item.categoria || null, items: [] };
      }
      map[catId].items.push(item);
    }
    return Object.values(map).sort((a, b) => {
      if (!a.cat && !b.cat) return 0;
      if (!a.cat) return 1;
      if (!b.cat) return -1;
      const ordDiff = (a.cat.ordem ?? 999) - (b.cat.ordem ?? 999);
      if (ordDiff !== 0) return ordDiff;
      return a.cat.nome.localeCompare(b.cat.nome, "pt-BR");
    });
  }, [itens]);

  // Detecta se categoria é bebida (pelo nome)
  function isBebida(cat) {
    if (!cat?.nome) return false;
    return /bebida/i.test(cat.nome);
  }

  if (loading) return (
    <div className="px-4 pb-3">
      <div className="flex gap-2 flex-wrap">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-14 w-28 rounded-xl bg-muted animate-pulse" />
        ))}
      </div>
    </div>
  );

  if (itens.length === 0) return null;

  return (
    <div data-id="pdv-itens-vendaveis" className="px-4 pb-3">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Seleção rápida</p>
      <div className="flex flex-col gap-3">
        {grouped.map(({ cat, items: groupItems }) => {
          const bebida = isBebida(cat);
          return (
            <div key={cat?._id || "sem-categoria"}>
              {cat?.nome && (
                <div className="flex items-center gap-1.5 mb-1.5">
                  {cat.cor && (
                    <div className="h-2.5 w-2.5 rounded-full shrink-0 border border-black/10" style={{ backgroundColor: cat.cor }} />
                  )}
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">{cat.nome}</p>
                </div>
              )}
              <div className="flex flex-wrap gap-2">
                {groupItems.map((item) => (
                  <button
                    data-id={`pdv-quick-item-${item._id}`}
                    key={item._id}
                    type="button"
                    onClick={() => onSelect(item)}
                    className={cn(
                      "flex flex-col items-start rounded-xl border transition-all active:scale-[0.97] text-left",
                      bebida
                        ? "px-3 py-2 border-border bg-card hover:bg-accent hover:border-primary/30 min-w-[90px]"
                        : "px-4 py-3 border-primary/20 bg-primary/5 hover:bg-primary/10 hover:border-primary/40 min-w-[120px]"
                    )}
                  >
                    <span className={cn(
                      "font-semibold leading-tight truncate max-w-[140px]",
                      bebida ? "text-sm text-foreground" : "text-[15px] text-foreground"
                    )}>
                      {item.nome}
                    </span>
                    <span className={cn(
                      "tabular-nums text-muted-foreground mt-0.5",
                      bebida ? "text-[11px]" : "text-xs"
                    )}>
                      R$&nbsp;{formatPrice(item.preco)}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Modo AVULSO ─────────────────────────────────────────────────────
function ModoAvulso() {
  const [cart, setCart] = useState([]);
  const [feedback, setFeedback] = useState(null);
  const [pagamentoOpen, setPagamentoOpen] = useState(false);
  const [finalizando, setFinalizando] = useState(false);
  const feedbackTimer = useRef(null);

  function showFeedback(f) {
    setFeedback(f);
    clearTimeout(feedbackTimer.current);
    feedbackTimer.current = setTimeout(() => setFeedback(null), 3000);
  }

  async function handleScan(code) {
    try {
      const res = await fetch(`/api/produtos?codigo=${encodeURIComponent(code)}`);
      const data = await res.json();
      const produto = data.data;
      if (!res.ok || !produto || produto.precoVenda <= 0) {
        showFeedback({ nome: `Código: ${code}`, ok: false });
        return;
      }
      setCart((prev) => {
        const idx = prev.findIndex((p) => p.produtoId === produto._id);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = { ...next[idx], quantidade: next[idx].quantidade + 1 };
          return next;
        }
        return [...prev, { produtoId: produto._id, nome: produto.nome, preco: produto.precoVenda, quantidade: 1 }];
      });
      showFeedback({ nome: produto.nome, preco: produto.precoVenda, ok: true });
    } catch {
      showFeedback({ nome: `Código: ${code}`, ok: false });
    }
  }

  function increment(p) {
    setCart((prev) => prev.map((i) =>
      i.produtoId === p.produtoId ? { ...i, quantidade: i.quantidade + 1 } : i
    ));
  }

  function decrement(p) {
    setCart((prev) =>
      prev.map((i) => i.produtoId === p.produtoId ? { ...i, quantidade: i.quantidade - 1 } : i)
         .filter((i) => i.quantidade > 0)
    );
  }

  async function handleConfirmarVenda(forma_pagamento) {
    setFinalizando(true);
    try {
      const res = await fetch("/api/pdv/venda", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itens: cart.map((i) => ({ produtoId: i.produtoId, quantidade: i.quantidade, preco: i.preco })),
          forma_pagamento,
        }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? "Erro ao finalizar venda"); return; }
      setPagamentoOpen(false);
      setCart([]);
      setFeedback(null);
      toast.success("Venda finalizada!");
    } finally {
      setFinalizando(false);
    }
  }

  const total = cart.reduce((a, p) => a + p.preco * p.quantidade, 0);
  const totalItens = cart.reduce((a, p) => a + p.quantidade, 0);

  function handleQuickSelect(item) {
    setCart((prev) => {
      const idx = prev.findIndex((p) => p.menuItemId === item._id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], quantidade: next[idx].quantidade + 1 };
        return next;
      }
      return [...prev, { menuItemId: item._id, produtoId: item._id, nome: item.nome, preco: item.preco, quantidade: 1 }];
    });
    showFeedback({ nome: item.nome, preco: item.preco, ok: true });
  }

  return (
    <>
      <div data-id="pdv-avulso-content" className="flex flex-col pb-36">
        <div className="px-4 pt-4 pb-3">
          <BarcodeScanner data-id="pdv-search-input" onScan={handleScan} placeholder="Escanear produto..." />
        </div>
        <ItensVendaveisGrid onSelect={handleQuickSelect} />
        <ScanFeedback feedback={feedback} onDismiss={() => setFeedback(null)} />
        <div data-id="pdv-cart">
          <ItemList items={cart} onIncrement={increment} onDecrement={decrement} mutating={null} />
        </div>
      </div>

      <div data-id="pdv-checkout-bar" className="fixed bottom-0 left-0 right-0 z-30 bg-background border-t border-border px-4 pb-6 pt-4">
        <div className="max-w-md mx-auto flex items-center justify-between gap-3">
          <div data-id="pdv-cart-summary">
            <p className="text-xs text-muted-foreground">{totalItens} {totalItens === 1 ? "item" : "itens"}</p>
            <p className="text-3xl font-bold tabular-nums leading-tight">R$&nbsp;{formatPrice(total)}</p>
          </div>
          <div className="flex items-center gap-2">
            {cart.length > 0 && (
              <button
                data-id="pdv-clear-cart-button"
                onClick={() => setCart([])}
                className="h-14 w-14 rounded-2xl border border-border flex items-center justify-center hover:bg-accent transition-colors"
                title="Limpar carrinho"
              >
                <Trash2 className="h-5 w-5 text-muted-foreground" />
              </button>
            )}
            <button
              data-id="pdv-checkout-button"
              onClick={() => { if (cart.length) setPagamentoOpen(true); }}
              disabled={!cart.length}
              className="h-14 px-8 rounded-2xl bg-primary text-primary-foreground font-bold text-base transition-all hover:bg-primary/90 active:scale-[0.97] disabled:opacity-40"
            >
              Finalizar
            </button>
          </div>
        </div>
      </div>

      <PagamentoDialog
        open={pagamentoOpen}
        onClose={() => setPagamentoOpen(false)}
        total={total}
        onConfirm={handleConfirmarVenda}
        loading={finalizando}
      />
    </>
  );
}

function NivelBadge({ nivel }) {
  if (!nivel || nivel === "muito") return null;
  if (nivel === "pouco") return <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700">Pouco</span>;
  if (nivel === "esgotado") return <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-red-100 text-red-600">Esgotado</span>;
  return null;
}

// ─── Modo COMANDA ────────────────────────────────────────────────────
function ModoComanda() {
  const [comanda, setComanda] = useState(null);
  const [pedidos, setPedidos] = useState([]);
  const [mutating, setMutating] = useState(null);
  const [closing, setClosing] = useState(false);
  const [pagamentoOpen, setPagamentoOpen] = useState(false);
  const [selectorOpen, setSelectorOpen] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const feedbackTimer = useRef(null);
  const dailyMenuRef = useRef(null); // map of menuItemId -> nivel

  useEffect(() => {
    fetch("/api/cardapio/hoje")
      .then((r) => r.json())
      .then((d) => {
        if (d.itens && d.itens.length > 0) {
          const map = {};
          d.itens.forEach((i) => { map[i.menuItem._id] = i.nivel; });
          dailyMenuRef.current = map;
        }
      })
      .catch(() => {});
  }, []);

  function showFeedback(f) {
    setFeedback(f);
    clearTimeout(feedbackTimer.current);
    feedbackTimer.current = setTimeout(() => setFeedback(null), 3000);
  }

  const fetchPedidos = useCallback(async (id) => {
    const res = await fetch(`/api/comandas/${id}`);
    const data = await res.json();
    if (res.ok) setPedidos(data.data.pedidos || []);
  }, []);

  function selectComanda(c) {
    setComanda(c);
    setSelectorOpen(false);
    fetchPedidos(c._id);
  }

  async function handleScan(code) {
    if (!comanda) { setSelectorOpen(true); return; }
    try {
      // 1. Encontra o produto do estoque pelo barcode
      const prodRes = await fetch(`/api/produtos?codigo=${encodeURIComponent(code)}`);
      const prodData = await prodRes.json();
      const produto = prodData.data;
      if (!prodRes.ok || !produto) { showFeedback({ nome: `Código: ${code}`, ok: false }); return; }

      // 2. Encontra o item do cardápio vinculado ao produto
      const cardRes = await fetch(`/api/cardapio?produtoId=${produto._id}`);
      const cardData = await cardRes.json();
      const menuItem = cardData.data;
      if (!menuItem) {
        showFeedback({ nome: produto.nome, ok: false, erro: "Não está no cardápio" });
        return;
      }

      // 2b. Verifica nivel no cardápio do dia
      const nivel = dailyMenuRef.current ? dailyMenuRef.current[menuItem._id] : undefined;
      if (nivel === "esgotado") {
        showFeedback({ nome: menuItem.nome, ok: false, erro: "Item esgotado hoje" });
        return;
      }

      // 3. Adiciona à comanda
      const addRes = await fetch(`/api/comandas/${comanda._id}/pedidos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ menuItemId: menuItem._id }),
      });
      if (!addRes.ok) { showFeedback({ nome: menuItem.nome, ok: false }); return; }
      showFeedback({ nome: menuItem.nome, preco: menuItem.preco, ok: true });
      fetchPedidos(comanda._id);
    } catch {
      showFeedback({ nome: `Código: ${code}`, ok: false });
    }
  }

  async function handleQty(p, action) {
    setMutating(p._id);
    await fetch(`/api/comandas/${comanda._id}/pedidos/${p._id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    await fetchPedidos(comanda._id);
    setMutating(null);
  }

  function handleClose() {
    if (!pedidos.length) { toast.warning("Adicione itens antes de fechar"); return; }
    setPagamentoOpen(true);
  }

  async function handleConfirmarFechamento(forma_pagamento) {
    setClosing(true);
    setPagamentoOpen(false);
    try {
      const res = await fetch(`/api/comandas/${comanda._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "fechar", forma_pagamento }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? "Erro ao fechar comanda"); return; }
      toast.success("Comanda fechada!");
      setComanda(null);
      setPedidos([]);
      setFeedback(null);
    } catch {
      toast.error("Erro ao fechar");
    } finally {
      setClosing(false);
    }
  }

  async function handleQuickSelectComanda(item) {
    if (!comanda) { setSelectorOpen(true); return; }
    const nivel = dailyMenuRef.current ? dailyMenuRef.current[item._id] : undefined;
    if (nivel === "esgotado") {
      showFeedback({ nome: item.nome, ok: false, erro: "Item esgotado hoje" });
      return;
    }
    try {
      const addRes = await fetch(`/api/comandas/${comanda._id}/pedidos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ menuItemId: item._id }),
      });
      if (!addRes.ok) { showFeedback({ nome: item.nome, ok: false }); return; }
      showFeedback({ nome: item.nome, preco: item.preco, ok: true });
      fetchPedidos(comanda._id);
    } catch {
      showFeedback({ nome: item.nome, ok: false });
    }
  }

  const total = pedidos.reduce((a, p) => a + p.preco * p.quantidade, 0);
  const totalItens = pedidos.reduce((a, p) => a + p.quantidade, 0);

  return (
    <>
      <div data-id="pdv-comanda-content" className="flex flex-col pb-36">
        {/* Seletor de comanda */}
        <div className="px-4 pt-4 pb-3">
          <button
            data-id="pdv-comanda-selector-trigger"
            onClick={() => setSelectorOpen(true)}
            className={cn(
              "w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-colors mb-3",
              comanda ? "bg-card border-border hover:bg-accent" : "bg-primary/10 border-primary/30 hover:bg-primary/15"
            )}
          >
            <div className="text-left">
              <p className="text-xs text-muted-foreground leading-none mb-0.5">Comanda</p>
              <p className={cn("text-sm font-semibold leading-none", comanda ? "text-foreground" : "text-primary")}>
                {comanda ? comanda.nome : "Selecionar comanda"}
              </p>
            </div>
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </button>
          <BarcodeScanner data-id="pdv-search-input" onScan={handleScan} placeholder="Escanear produto..." />
        </div>
        <ItensVendaveisGrid onSelect={handleQuickSelectComanda} />
        <ScanFeedback feedback={feedback} onDismiss={() => setFeedback(null)} />
        <div data-id="pdv-cart">
          <ItemList
            items={pedidos}
            onIncrement={(p) => handleQty(p, "increment")}
            onDecrement={(p) => handleQty(p, "decrement")}
            mutating={mutating}
            nivelMap={dailyMenuRef.current}
          />
        </div>
      </div>

      <div data-id="pdv-checkout-bar" className="fixed bottom-0 left-0 right-0 z-30 bg-background border-t border-border px-4 pb-6 pt-4">
        <div className="max-w-md mx-auto flex items-center justify-between gap-3">
          <div data-id="pdv-cart-summary">
            <p className="text-xs text-muted-foreground">{totalItens} {totalItens === 1 ? "item" : "itens"}</p>
            <p className="text-3xl font-bold tabular-nums leading-tight">R$&nbsp;{formatPrice(total)}</p>
          </div>
          {pedidos.length > 0 && comanda && (
            <button
              data-id="pdv-checkout-button"
              onClick={handleClose}
              disabled={closing}
              className="h-14 px-8 rounded-2xl bg-primary text-primary-foreground font-bold text-base hover:bg-primary/90 active:scale-[0.97] disabled:opacity-70 transition-all"
            >
              {closing ? "..." : "Fechar"}
            </button>
          )}
        </div>
      </div>

      <ComandaSelector open={selectorOpen} onClose={() => setSelectorOpen(false)} onSelect={selectComanda} />
      <PagamentoDialog
        open={pagamentoOpen}
        onClose={() => setPagamentoOpen(false)}
        total={pedidos.reduce((a, p) => a + p.preco * p.quantidade, 0)}
        onConfirm={handleConfirmarFechamento}
        loading={closing}
      />
    </>
  );
}

// ─── Página ──────────────────────────────────────────────────────────
export default function PDVPage() {
  const [modo, setModo] = useState("avulso");

  return (
    <div data-id="pdv-page">
      {/* Seletor de modo */}
      <div data-id="pdv-mode-selector" className="px-4 pt-4">
        <div className="grid grid-cols-2 gap-1.5 bg-muted rounded-xl p-1">
          {[
            { key: "avulso", label: "Venda avulsa" },
            { key: "comanda", label: "Comanda" },
          ].map(({ key, label }) => (
            <button
              key={key}
              data-id={`pdv-mode-${key}`}
              onClick={() => setModo(key)}
              className={cn(
                "py-2 rounded-lg text-sm font-medium transition-colors",
                modo === key ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {modo === "avulso" ? <ModoAvulso /> : <ModoComanda />}
    </div>
  );
}
