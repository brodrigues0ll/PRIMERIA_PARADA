"use client";
import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Plus, UtensilsCrossed, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import MenuItemCard from "@/components/MenuItemCard";

export default function PriceTablePage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const router = useRouter();

  const fetchItems = useCallback(async () => {
    try {
      const res = await fetch("/api/cardapio");
      const data = await res.json();
      if (res.ok) setItems(data.data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const filtered = useMemo(() =>
    items
      .filter((i) => i.nome.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR")),
    [items, search]
  );

  const grouped = useMemo(() => {
    const map = {};
    for (const item of filtered) {
      const letter = item.nome[0].toUpperCase();
      if (!map[letter]) map[letter] = [];
      map[letter].push(item);
    }
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b));
  }, [filtered]);

  return (
    <>
      <div className="pb-28">
        <div className="sticky top-14 z-20 bg-background/90 backdrop-blur-md border-b border-border px-4 py-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              className="pl-9 pr-9 bg-card border-border h-10"
              placeholder="Buscar produto..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {loading && (
          <div className="mx-4 mt-4 rounded-2xl border border-border overflow-hidden bg-card">
            {[...Array(7)].map((_, i) => (
              <div key={i}>
                <div className="flex items-center justify-between px-4 py-3.5">
                  <div className="flex flex-col gap-1.5">
                    <Skeleton className="h-4 w-36" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                  <Skeleton className="h-4 w-14" />
                </div>
                {i < 6 && <Separator />}
              </div>
            ))}
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 px-8 text-center">
            <div className="h-14 w-14 rounded-2xl bg-muted flex items-center justify-center mb-4">
              <UtensilsCrossed className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm font-semibold text-foreground mb-1">
              {search ? "Nenhum item encontrado" : "Cardápio vazio"}
            </p>
            <p className="text-xs text-muted-foreground">
              {search ? `Nenhum resultado para "${search}"` : "Adicione o primeiro produto"}
            </p>
          </div>
        )}

        {!loading && grouped.length > 0 && (
          <div className="px-4 pt-4 flex flex-col gap-4">
            <p className="text-xs text-muted-foreground px-1">
              {filtered.length} {filtered.length === 1 ? "item" : "itens"}
            </p>
            {grouped.map(([letter, groupItems]) => (
              <div key={letter}>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1 mb-1.5">
                  {letter}
                </p>
                <div className="rounded-2xl border border-border bg-card overflow-hidden">
                  {groupItems.map((item, idx) => (
                    <div key={item._id}>
                      <MenuItemCard
                        item={item}
                        onClick={() => router.push(`/price-table/${item._id}/editar`)}
                      />
                      {idx < groupItems.length - 1 && <Separator />}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="fixed bottom-6 right-5 z-30">
        <Button
          size="icon"
          className="h-14 w-14 rounded-2xl bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25"
          onClick={() => router.push("/price-table/novo")}
        >
          <Plus className="h-6 w-6" />
        </Button>
      </div>
    </>
  );
}
