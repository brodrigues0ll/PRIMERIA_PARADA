"use client";
import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { Search, Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { formatPrice } from "@/lib/utils";

export default function AdicionarAoEstoqueModal({ open, onClose, trackedIds, onSuccess }) {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(null);

  useEffect(() => {
    if (!open) return;
    setSearch("");
    setLoading(true);
    fetch("/api/cardapio")
      .then((r) => r.json())
      .then((d) => { if (d.data) setItems(d.data); })
      .finally(() => setLoading(false));
  }, [open]);

  // Exibe apenas itens que ainda não estão no controle de estoque
  const available = useMemo(() =>
    items
      .filter((i) => !trackedIds.includes(i._id))
      .filter((i) => i.nome.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR")),
    [items, trackedIds, search]
  );

  async function handleAdd(item) {
    setAdding(item._id);
    try {
      const res = await fetch("/api/estoque", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ menuItemId: item._id }),
      });
      if (!res.ok) { toast.error("Erro ao adicionar"); return; }
      toast.success(`${item.nome} adicionado ao estoque`);
      onSuccess?.();
    } catch {
      toast.error("Erro ao adicionar");
    } finally {
      setAdding(null);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="bg-card border-border sm:max-w-md flex flex-col max-h-[85vh]">
        <DialogHeader>
          <DialogTitle>Adicionar ao estoque</DialogTitle>
          <DialogDescription>
            Escolha quais produtos do cardápio deseja controlar
          </DialogDescription>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            className="pl-9 bg-background border-border"
            placeholder="Buscar produto..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
          />
        </div>

        <div className="flex flex-col overflow-y-auto flex-1 -mx-6 px-6">
          {loading && (
            <div className="flex flex-col gap-3 py-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full rounded-lg" />
              ))}
            </div>
          )}

          {!loading && available.length === 0 && (
            <p className="text-center text-sm text-muted-foreground py-10">
              {search ? "Nenhum produto encontrado" : "Todos os produtos já estão no estoque"}
            </p>
          )}

          {!loading && available.map((item, i) => (
            <div key={item._id}>
              <div className="flex items-center justify-between py-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{item.nome}</p>
                  <p className="text-xs text-muted-foreground tabular-nums">
                    R$&nbsp;{formatPrice(item.preco)}
                  </p>
                </div>
                <button
                  onClick={() => handleAdd(item)}
                  disabled={adding === item._id}
                  className="h-8 w-8 rounded-lg bg-primary/10 hover:bg-primary/20 flex items-center justify-center transition-colors shrink-0 disabled:opacity-50"
                >
                  {adding === item._id
                    ? <span className="h-3.5 w-3.5 rounded-full border-2 border-primary/40 border-t-primary animate-spin" />
                    : <Plus className="h-4 w-4 text-primary" />
                  }
                </button>
              </div>
              {i < available.length - 1 && <Separator />}
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
