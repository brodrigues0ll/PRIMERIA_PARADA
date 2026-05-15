"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { Plus, Minus, ChevronDown, ShoppingCart, X, CheckCircle2, AlertCircle, Trash2 } from "lucide-react";
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
} from "@/components/ui/dialog";
import BarcodeScanner from "@/components/BarcodeScanner";
import { formatPrice, cn } from "@/lib/utils";

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
      <DialogContent className="bg-card border-border sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Selecionar comanda</DialogTitle>
        </DialogHeader>
        {loading && (
          <div className="flex flex-col gap-2">
            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-xl" />)}
          </div>
        )}
        {!loading && comandas.length > 0 && (
          <div className="rounded-xl border border-border overflow-hidden">
            {comandas.map((c, i) => (
              <div key={c._id}>
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
        <form onSubmit={handleCreate} className="flex gap-2 pt-1">
          <Input
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Nome da nova comanda"
            className="flex-1 bg-background border-border"
            autoFocus
          />
          <Button type="submit" disabled={creating || !nome.trim()} className="bg-primary hover:bg-primary/90 shrink-0">
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
function ItemList({ items, onIncrement, onDecrement, mutating }) {
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
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="px-4 py-2.5 border-b border-border flex items-center justify-between">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Carrinho</p>
          <p className="text-xs text-muted-foreground">
            {items.reduce((a, p) => a + p.quantidade, 0)} itens
          </p>
        </div>
        {[...items].reverse().map((p, i) => (
          <div key={p._id ?? p.produtoId}>
            <div className="flex items-center gap-3 px-4 py-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{p.nome}</p>
                <p className="text-xs text-muted-foreground tabular-nums mt-0.5">
                  R$&nbsp;{formatPrice(p.preco)} × {p.quantidade}
                  <span className="text-foreground/70 font-semibold ml-2">
                    R$&nbsp;{formatPrice(p.preco * p.quantidade)}
                  </span>
                </p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => onDecrement(p)}
                  disabled={mutating === (p._id ?? p.produtoId)}
                  className="h-7 w-7 rounded-lg border border-border flex items-center justify-center hover:bg-accent disabled:opacity-40 transition-colors"
                >
                  <Minus className="h-3 w-3" />
                </button>
                <span className="text-sm font-bold w-5 text-center tabular-nums">{p.quantidade}</span>
                <button
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
        ))}
      </div>
    </div>
  );
}

// ─── Modo AVULSO ─────────────────────────────────────────────────────
function ModoAvulso() {
  const [cart, setCart] = useState([]);
  const [feedback, setFeedback] = useState(null);
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

  async function finalizar() {
    await Promise.allSettled(
      cart.map((item) =>
        fetch(`/api/produtos/${item.produtoId}/movimento`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tipo: "saida", quantidade: item.quantidade, observacao: "Venda avulsa" }),
        })
      )
    );
    setCart([]);
    setFeedback(null);
    toast.success("Venda finalizada!");
  }

  const total = cart.reduce((a, p) => a + p.preco * p.quantidade, 0);
  const totalItens = cart.reduce((a, p) => a + p.quantidade, 0);

  return (
    <>
      <div className="flex flex-col pb-36">
        <div className="px-4 pt-4 pb-3">
          <BarcodeScanner onScan={handleScan} placeholder="Escanear produto..." />
        </div>
        <ScanFeedback feedback={feedback} onDismiss={() => setFeedback(null)} />
        <ItemList items={cart} onIncrement={increment} onDecrement={decrement} mutating={null} />
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-30 bg-background border-t border-border px-4 pb-6 pt-4">
        <div className="max-w-md mx-auto flex items-center justify-between gap-3">
          <div>
            <p className="text-xs text-muted-foreground">{totalItens} {totalItens === 1 ? "item" : "itens"}</p>
            <p className="text-3xl font-bold tabular-nums leading-tight">R$&nbsp;{formatPrice(total)}</p>
          </div>
          <div className="flex items-center gap-2">
            {cart.length > 0 && (
              <button
                onClick={() => setCart([])}
                className="h-14 w-14 rounded-2xl border border-border flex items-center justify-center hover:bg-accent transition-colors"
                title="Limpar carrinho"
              >
                <Trash2 className="h-5 w-5 text-muted-foreground" />
              </button>
            )}
            <button
              onClick={finalizar}
              disabled={!cart.length}
              className="h-14 px-8 rounded-2xl bg-primary text-primary-foreground font-bold text-base transition-all hover:bg-primary/90 active:scale-[0.97] disabled:opacity-40"
            >
              Finalizar
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Modo COMANDA ────────────────────────────────────────────────────
function ModoComanda() {
  const [comanda, setComanda] = useState(null);
  const [pedidos, setPedidos] = useState([]);
  const [mutating, setMutating] = useState(null);
  const [closing, setClosing] = useState(false);
  const [selectorOpen, setSelectorOpen] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const feedbackTimer = useRef(null);

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

  async function handleClose() {
    if (!pedidos.length) { toast.warning("Adicione itens antes de fechar"); return; }
    setClosing(true);
    try {
      await fetch(`/api/comandas/${comanda._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "fechar" }),
      });
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

  const total = pedidos.reduce((a, p) => a + p.preco * p.quantidade, 0);
  const totalItens = pedidos.reduce((a, p) => a + p.quantidade, 0);

  return (
    <>
      <div className="flex flex-col pb-36">
        {/* Seletor de comanda */}
        <div className="px-4 pt-4 pb-3">
          <button
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
          <BarcodeScanner onScan={handleScan} placeholder="Escanear produto..." />
        </div>
        <ScanFeedback feedback={feedback} onDismiss={() => setFeedback(null)} />
        <ItemList
          items={pedidos}
          onIncrement={(p) => handleQty(p, "increment")}
          onDecrement={(p) => handleQty(p, "decrement")}
          mutating={mutating}
        />
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-30 bg-background border-t border-border px-4 pb-6 pt-4">
        <div className="max-w-md mx-auto flex items-center justify-between gap-3">
          <div>
            <p className="text-xs text-muted-foreground">{totalItens} {totalItens === 1 ? "item" : "itens"}</p>
            <p className="text-3xl font-bold tabular-nums leading-tight">R$&nbsp;{formatPrice(total)}</p>
          </div>
          {pedidos.length > 0 && comanda && (
            <button
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
    </>
  );
}

// ─── Página ──────────────────────────────────────────────────────────
export default function PDVPage() {
  const [modo, setModo] = useState("avulso");

  return (
    <div>
      {/* Seletor de modo */}
      <div className="px-4 pt-4">
        <div className="grid grid-cols-2 gap-1.5 bg-muted rounded-xl p-1">
          {[
            { key: "avulso", label: "Venda avulsa" },
            { key: "comanda", label: "Comanda" },
          ].map(({ key, label }) => (
            <button
              key={key}
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
