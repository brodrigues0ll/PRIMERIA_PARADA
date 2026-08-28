"use client";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Search, Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { formatPrice } from "@/lib/utils";

export default function AddProductsModal({ open, onClose, comandaId, onAdded }) {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(null);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    fetch("/api/cardapio")
      .then((r) => r.json())
      .then((d) => { if (d.data) setItems(d.data); })
      .finally(() => setLoading(false));
  }, [open]);

  async function handleAdd(item) {
    setAdding(item._id);
    try {
      const res = await fetch(`/api/comandas/${comandaId}/pedidos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ menuItemId: item._id }),
      });
      if (res.ok) {
        toast.success(`${item.nome} adicionado`);
        onAdded?.();
      }
    } catch {
      toast.error("Erro ao adicionar item");
    } finally {
      setAdding(null);
    }
  }

  const filtered = items
    .filter((i) => i.nome.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => a.nome.localeCompare(b.nome));

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="bg-card border-border sm:max-w-md flex flex-col max-h-[85vh]">
        <DialogHeader>
          <DialogTitle>Adicionar item</DialogTitle>
        </DialogHeader>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9 bg-background border-input"
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
          {!loading && filtered.length === 0 && (
            <p className="text-center text-sm text-muted-foreground py-8">
              Nenhum item encontrado
            </p>
          )}
          {!loading && filtered.map((item, i) => (
            <div key={item._id}>
              <div className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-medium text-foreground">{item.nome}</p>
                  <p className="text-xs text-muted-foreground tabular-nums">
                    R$ {formatPrice(item.preco)}
                  </p>
                </div>
                <Button
                  size="sm"
                  className="bg-primary hover:bg-primary/90 gap-1"
                  onClick={() => handleAdd(item)}
                  disabled={adding === item._id}
                >
                  <Plus className="h-3.5 w-3.5" />
                  {adding === item._id ? "..." : "Add"}
                </Button>
              </div>
              {i < filtered.length - 1 && <Separator />}
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
