"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, X, Package, ChevronDown, ChevronUp, Link2 } from "lucide-react";
import { cn, formatPrice } from "@/lib/utils";

function parseDecimal(str) {
  return parseFloat(String(str).replace(",", ".")) || 0;
}

export default function EditarCardapioPage() {
  const router = useRouter();
  const { id } = useParams();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [nome, setNome] = useState("");
  const [preco, setPreco] = useState("");
  const [produtoRef, setProdutoRef] = useState(null);

  const [showImport, setShowImport] = useState(false);
  const [produtos, setProdutos] = useState([]);
  const [loadingProdutos, setLoadingProdutos] = useState(false);
  const [searchProduto, setSearchProduto] = useState("");

  const precoNum = parseDecimal(preco);

  useEffect(() => {
    async function fetchItem() {
      try {
        const res = await fetch(`/api/cardapio/${id}`);
        const data = await res.json();
        if (res.ok && data.data) {
          const item = data.data;
          setNome(item.nome || "");
          setPreco(String(item.preco).replace(".", ","));
          if (item.produtoRef) setProdutoRef(item.produtoRef);
        } else {
          toast.error("Item não encontrado");
          router.push("/price-table");
        }
      } catch {
        toast.error("Erro ao carregar item");
        router.push("/price-table");
      } finally {
        setLoading(false);
      }
    }
    fetchItem();
  }, [id, router]);

  const fetchProdutos = useCallback(async () => {
    setLoadingProdutos(true);
    try {
      const res = await fetch("/api/produtos");
      const data = await res.json();
      if (res.ok) setProdutos(data.data || []);
    } finally {
      setLoadingProdutos(false);
    }
  }, []);

  useEffect(() => {
    if (showImport && produtos.length === 0) fetchProdutos();
  }, [showImport, produtos.length, fetchProdutos]);

  function selectProduto(produto) {
    setProdutoRef(produto);
    setShowImport(false);
    setSearchProduto("");
  }

  const filteredProdutos = produtos.filter((p) =>
    p.nome.toLowerCase().includes(searchProduto.toLowerCase()) ||
    (p.codigo && p.codigo.includes(searchProduto))
  );

  async function handleSubmit(e) {
    e.preventDefault();
    if (!nome.trim() || precoNum <= 0) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/cardapio/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: nome.trim(),
          preco: precoNum,
          produtoRef: produtoRef?._id ?? null,
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        toast.error(d.error || "Erro ao salvar");
        return;
      }
      toast.success("Item atualizado");
      router.push("/price-table");
    } catch {
      toast.error("Erro ao salvar");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Remover este item do cardápio?")) return;
    try {
      await fetch(`/api/cardapio/${id}`, { method: "DELETE" });
      toast.success("Item removido");
      router.push("/price-table");
    } catch {
      toast.error("Erro ao remover");
    }
  }

  if (loading) {
    return (
      <div className="px-4 pt-6 pb-10 flex flex-col gap-5">
        <Skeleton className="h-5 w-32" />
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex flex-col gap-1.5">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-full rounded-md" />
          </div>
        ))}
        <Skeleton className="h-10 w-full rounded-md" />
      </div>
    );
  }

  return (
    <div className="px-4 pt-6 pb-10">
      <h2 className="text-lg font-semibold mb-1">Editar item</h2>
      <p className="text-sm text-muted-foreground mb-6">Cardápio</p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="nome">Nome *</Label>
          <Input id="nome" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Nome do item" required />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="preco">Preço de venda (R$) *</Label>
          <Input id="preco" value={preco} onChange={(e) => setPreco(e.target.value)} inputMode="decimal" placeholder="0,00" required />
        </div>

        <Separator />

        {/* Vínculo com produto do estoque */}
        {produtoRef ? (
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Link2 className="h-4 w-4 text-emerald-500 shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-emerald-600">Vinculado ao estoque</p>
                  <p className="text-sm text-foreground font-medium">{produtoRef.nome ?? "..."}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => { setProdutoRef(null); setShowImport(true); }}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  Trocar
                </button>
                <button type="button" onClick={() => setProdutoRef(null)} className="text-muted-foreground hover:text-foreground transition-colors">
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-1 pl-6">
              Ao vender, o estoque deste produto será decrementado automaticamente
            </p>
          </div>
        ) : (
          <div>
            <button
              type="button"
              onClick={() => setShowImport((v) => !v)}
              className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-dashed border-border hover:border-primary/40 hover:bg-accent transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <Package className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Vincular a produto do estoque</span>
              </div>
              {showImport
                ? <ChevronUp className="h-4 w-4 text-muted-foreground" />
                : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
            </button>

            {showImport && (
              <div className="mt-3 flex flex-col gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <Input
                    className="pl-9"
                    placeholder="Buscar produto no estoque..."
                    value={searchProduto}
                    onChange={(e) => setSearchProduto(e.target.value)}
                    autoFocus
                  />
                </div>
                <div className="rounded-xl border border-border bg-card overflow-hidden max-h-56 overflow-y-auto">
                  {loadingProdutos && (
                    <div className="p-4 text-xs text-muted-foreground text-center">Carregando...</div>
                  )}
                  {!loadingProdutos && filteredProdutos.length === 0 && (
                    <p className="text-xs text-muted-foreground text-center py-6">Nenhum produto encontrado</p>
                  )}
                  {!loadingProdutos && filteredProdutos.map((produto, idx) => (
                    <div key={produto._id}>
                      <button
                        type="button"
                        onClick={() => selectProduto(produto)}
                        className="w-full text-left flex items-center justify-between px-4 py-3 hover:bg-accent transition-colors"
                      >
                        <div>
                          <p className="text-sm font-medium text-foreground">{produto.nome}</p>
                          <p className="text-xs text-muted-foreground">
                            {produto.quantidade} un.
                            {produto.precoVenda > 0 && ` · R$\u00a0${formatPrice(produto.precoVenda)}`}
                          </p>
                        </div>
                      </button>
                      {idx < filteredProdutos.length - 1 && <Separator />}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <Button type="submit" className="w-full bg-primary" disabled={saving || !nome.trim() || precoNum <= 0}>
          {saving ? "Salvando..." : "Salvar"}
        </Button>

        <Button type="button" variant="outline" className="w-full" onClick={() => router.back()}>Cancelar</Button>

        <Button type="button" variant="destructive" className="w-full" onClick={handleDelete}>
          Remover do cardápio
        </Button>
      </form>
    </div>
  );
}
