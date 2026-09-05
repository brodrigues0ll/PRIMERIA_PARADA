"use client";
import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Plus, UtensilsCrossed, Search, X, Tag, CalendarDays, DollarSign, BookOpen } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import MenuItemCard from "@/components/MenuItemCard";

const TABS = [
  { key: "vendavel", label: "Preços", icon: DollarSign, description: "Itens faturáveis com preço (PDV)" },
  { key: "cardapio", label: "Itens do Cardápio", icon: BookOpen, description: "Componentes informativos sem preço" },
];

function buildGrouped(items) {
  const map = {};
  for (const item of items) {
    const catId = item.categoria?._id || "sem-categoria";
    if (!map[catId]) {
      map[catId] = { cat: item.categoria || null, items: [] };
    }
    map[catId].items.push(item);
  }
  for (const key of Object.keys(map)) {
    map[key].items.sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
  }
  return Object.values(map).sort((a, b) => {
    if (!a.cat && !b.cat) return 0;
    if (!a.cat) return 1;
    if (!b.cat) return -1;
    const ordDiff = (a.cat.ordem ?? 999) - (b.cat.ordem ?? 999);
    if (ordDiff !== 0) return ordDiff;
    return a.cat.nome.localeCompare(b.cat.nome, "pt-BR");
  });
}

export default function PriceTablePage() {
  const [tab, setTab] = useState("vendavel");
  const [vendaveis, setVendaveis] = useState([]);
  const [cardapio, setCardapio] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const router = useRouter();

  const fetchItems = useCallback(async () => {
    try {
      const [resV, resC] = await Promise.all([
        fetch("/api/cardapio?vendavel=true"),
        fetch("/api/cardapio?vendavel=false"),
      ]);
      const [dataV, dataC] = await Promise.all([resV.json(), resC.json()]);
      if (resV.ok) setVendaveis(dataV.data || []);
      if (resC.ok) setCardapio(dataC.data || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const activeItems = tab === "vendavel" ? vendaveis : cardapio;

  const filtered = useMemo(() =>
    activeItems.filter((i) => i.nome.toLowerCase().includes(search.toLowerCase())),
    [activeItems, search]
  );

  const grouped = useMemo(() => buildGrouped(filtered), [filtered]);

  const emptyLabel = tab === "vendavel" ? "Nenhum item com preço cadastrado" : "Nenhum item de cardápio cadastrado";
  const emptyHint = tab === "vendavel"
    ? "Adicione pratos e bebidas com preço"
    : "Adicione proteínas, acompanhamentos e bases";

  return (
    <>
      <div data-id="price-table-page" className="pb-28">
        {/* Nav links row */}
        <div className="sticky top-14 z-20 bg-background/90 backdrop-blur-md border-b border-border px-4 py-2 flex items-center gap-2">
          <Link
            data-id="nav-categorias-link"
            href="/price-table/categorias"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-medium text-[#54656f] border border-border hover:bg-accent hover:text-[#111b21] transition-colors"
          >
            <Tag className="h-3.5 w-3.5" />
            Categorias
          </Link>
          <Link
            data-id="nav-dia-link"
            href="/price-table/dia"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-medium text-[#54656f] border border-border hover:bg-accent hover:text-[#111b21] transition-colors"
          >
            <CalendarDays className="h-3.5 w-3.5" />
            Cardápio do Dia
          </Link>
        </div>

        {/* Tabs */}
        <div data-id="price-table-tabs" className="sticky top-[calc(3.5rem+42px)] z-20 bg-background/90 backdrop-blur-md border-b border-border">
          <div className="px-4 pt-2 flex gap-1">
            {TABS.map(({ key, label, icon: Icon }) => (
              <button
                data-id={`price-table-tab-${key}`}
                key={key}
                onClick={() => { setTab(key); setSearch(""); }}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-2 text-[13px] font-medium rounded-t-lg border-b-2 transition-colors",
                  tab === key
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
                <span className={cn(
                  "ml-1 text-[11px] px-1.5 py-0.5 rounded-full font-semibold",
                  tab === key ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                )}>
                  {key === "vendavel" ? vendaveis.length : cardapio.length}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Search bar */}
        <div data-id="price-table-search-bar" className="sticky top-[calc(3.5rem+42px+44px)] z-20 bg-background/90 backdrop-blur-md border-b border-border px-4 py-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              data-id="price-table-search-input"
              className="pl-9 pr-9 bg-card border-border h-10"
              placeholder="Buscar..."
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
              {search ? "Nenhum item encontrado" : emptyLabel}
            </p>
            <p className="text-xs text-muted-foreground">
              {search ? `Nenhum resultado para "${search}"` : emptyHint}
            </p>
          </div>
        )}

        {!loading && grouped.length > 0 && (
          <div data-id="price-table-list" className="px-4 pt-4 flex flex-col gap-4">
            <p className="text-xs text-muted-foreground px-1">
              {filtered.length} {filtered.length === 1 ? "item" : "itens"}
            </p>
            {grouped.map(({ cat, items: groupItems }) => {
              const groupKey = cat?._id || "sem-categoria";
              const groupLabel = cat?.nome || "Sem categoria";
              return (
                <div data-id={`price-table-group-${groupKey}`} key={groupKey}>
                  <div className="flex items-center gap-2 px-1 mb-1.5">
                    {cat?.cor && (
                      <div
                        className="h-3 w-3 rounded-full shrink-0 border border-black/10"
                        style={{ backgroundColor: cat.cor }}
                      />
                    )}
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      {groupLabel}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-border bg-card overflow-hidden">
                    {groupItems.map((item, idx) => (
                      <div data-id={`price-item-${item._id}`} key={item._id}>
                        <MenuItemCard
                          item={item}
                          categoria={item.categoria}
                          ativo={item.ativo !== false}
                          onClick={() => router.push(`/price-table/${item._id}/editar`)}
                        />
                        {idx < groupItems.length - 1 && <Separator />}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="fixed bottom-6 right-5 z-30">
        <Button
          data-id="add-price-button"
          size="icon"
          className="h-14 w-14 rounded-2xl bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25"
          onClick={() => router.push(`/price-table/novo?vendavel=${tab === "vendavel" ? "true" : "false"}`)}
        >
          <Plus className="h-6 w-6" />
        </Button>
      </div>
    </>
  );
}
