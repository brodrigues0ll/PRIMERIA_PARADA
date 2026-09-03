"use client";
import { useState, useEffect, useCallback, useMemo } from "react";
import { ArrowLeft, Search, X, Trash2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { cn, formatPrice } from "@/lib/utils";

const NIVEL_OPTIONS = [
  { value: "muito",    label: "Muito",    active: "bg-green-100 text-green-700", inactive: "bg-[#f0f2f5] text-[#54656f]" },
  { value: "pouco",    label: "Pouco",    active: "bg-amber-100 text-amber-700", inactive: "bg-[#f0f2f5] text-[#54656f]" },
  { value: "esgotado", label: "Esgotado", active: "bg-red-100 text-red-600",   inactive: "bg-[#f0f2f5] text-[#54656f]" },
];

function formatDatePT(date) {
  return date.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function ColorDot({ cor }) {
  return (
    <div
      className="h-3 w-3 rounded-full shrink-0 border border-black/10"
      style={{ backgroundColor: cor || "#d1d5db" }}
    />
  );
}

export default function CardapioDiaPage() {
  const [hoje, setHoje] = useState(null);       // { data, itens: [{ menuItem, nivel }] }
  const [allItems, setAllItems] = useState([]);  // all active MenuItem
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [updatingId, setUpdatingId] = useState(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [resHoje, resAll] = await Promise.all([
        fetch("/api/cardapio/hoje"),
        fetch("/api/cardapio"),
      ]);
      const [dataHoje, dataAll] = await Promise.all([
        resHoje.json(),
        resAll.json(),
      ]);
      if (resHoje.ok) setHoje(dataHoje);
      if (resAll.ok) setAllItems(Array.isArray(dataAll) ? dataAll : (dataAll.data || []));
    } catch {
      toast.error("Erro ao carregar cardápio");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // IDs already in today's menu
  const hojeIds = useMemo(() => {
    if (!hoje?.itens) return new Set();
    return new Set(hoje.itens.map((i) => i.menuItem?._id).filter(Boolean));
  }, [hoje]);

  // Available items = active items not yet in today
  const available = useMemo(() => {
    return allItems.filter((item) => !hojeIds.has(item._id));
  }, [allItems, hojeIds]);

  const filtered = useMemo(() => {
    if (!search.trim()) return available;
    const q = search.toLowerCase();
    return available.filter((i) => i.nome.toLowerCase().includes(q));
  }, [available, search]);

  // Group available by categoria
  const groupedAvailable = useMemo(() => {
    const map = {};
    for (const item of filtered) {
      const catId = item.categoria?._id || "sem-categoria";
      if (!map[catId]) {
        map[catId] = {
          cat: item.categoria || null,
          items: [],
        };
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
  }, [filtered]);

  async function handleNivelChange(menuItemId, nivel) {
    setUpdatingId(menuItemId);
    try {
      const res = await fetch("/api/cardapio/hoje", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ menuItemId, nivel }),
      });
      if (!res.ok) { toast.error("Erro ao atualizar nível"); return; }
      setHoje((prev) => ({
        ...prev,
        itens: prev.itens.map((i) =>
          i.menuItem?._id === menuItemId ? { ...i, nivel } : i
        ),
      }));
    } catch {
      toast.error("Erro ao atualizar nível");
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleRemove(menuItemId) {
    try {
      const res = await fetch("/api/cardapio/hoje", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ menuItemId }),
      });
      if (!res.ok) { toast.error("Erro ao remover item"); return; }
      setHoje((prev) => ({
        ...prev,
        itens: prev.itens.filter((i) => i.menuItem?._id !== menuItemId),
      }));
      toast.success("Item removido do cardápio de hoje");
    } catch {
      toast.error("Erro ao remover item");
    }
  }

  async function handleAdd(menuItemId) {
    try {
      // Build full itens list and add new one
      const currentItens = (hoje?.itens || []).map((i) => ({
        menuItemId: i.menuItem?._id,
        nivel: i.nivel,
      }));
      const newItens = [...currentItens, { menuItemId, nivel: "muito" }];
      const res = await fetch("/api/cardapio/hoje", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itens: newItens }),
      });
      if (!res.ok) { toast.error("Erro ao adicionar item"); return; }
      const updated = await res.json();
      setHoje(updated);
      toast.success("Item adicionado ao cardápio de hoje");
    } catch {
      toast.error("Erro ao adicionar item");
    }
  }

  const todayStr = formatDatePT(new Date());

  return (
    <div data-id="cardapio-dia-page" className="min-h-screen bg-[#f0f2f5]">
      {/* Header */}
      <div
        data-id="cardapio-dia-header"
        className="sticky top-0 z-10 bg-white border-b border-[#e9edef] h-[60px] flex items-center gap-4 px-6"
      >
        <Link
          data-id="cardapio-dia-back-button"
          href="/price-table"
          className="h-8 w-8 flex items-center justify-center rounded-full text-[#54656f] hover:bg-[#f0f2f5] transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="min-w-0">
          <h1 className="text-[17px] font-medium text-[#111b21] leading-tight">Cardápio de Hoje</h1>
          <p className="text-[12px] text-[#54656f] truncate">{todayStr}</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 flex flex-col gap-6">

        {/* Section A — Itens no cardápio hoje */}
        <div data-id="hoje-section" className="bg-white rounded-xl border border-[#e9edef] overflow-hidden">
          <div className="px-6 py-4 border-b border-[#e9edef]">
            <h2 className="text-[15px] font-medium text-[#111b21]">Itens no cardápio hoje</h2>
            <p className="text-[13px] text-[#54656f] mt-0.5">
              {hoje?.itens?.length
                ? `${hoje.itens.length} ${hoje.itens.length === 1 ? "item" : "itens"} disponíveis`
                : "Nenhum item adicionado"}
            </p>
          </div>

          {loading && (
            <div className="px-6 py-8 text-center text-[13px] text-[#54656f]">Carregando...</div>
          )}

          {!loading && (!hoje?.itens || hoje.itens.length === 0) && (
            <div data-id="hoje-empty" className="px-6 py-8 text-center text-[13px] text-[#54656f]">
              Nenhum item no cardápio de hoje. Adicione abaixo.
            </div>
          )}

          {!loading && hoje?.itens && hoje.itens.length > 0 && (
            <div data-id="hoje-list" className="divide-y divide-[#e9edef]">
              {hoje.itens.map(({ menuItem, nivel }) => {
                if (!menuItem) return null;
                const isUpdating = updatingId === menuItem._id;
                return (
                  <div
                    data-id={`hoje-item-${menuItem._id}`}
                    key={menuItem._id}
                    className="px-6 py-3 flex flex-col gap-2"
                  >
                    <div className="flex items-center gap-2">
                      {menuItem.categoria?.cor && <ColorDot cor={menuItem.categoria.cor} />}
                      <div className="flex-1 min-w-0">
                        <p className="text-[14px] font-medium text-[#111b21] truncate">{menuItem.nome}</p>
                        {menuItem.categoria?.nome && (
                          <p className="text-[12px] text-[#54656f]">{menuItem.categoria.nome}</p>
                        )}
                      </div>
                      <button
                        data-id={`hoje-remove-${menuItem._id}`}
                        type="button"
                        onClick={() => handleRemove(menuItem._id)}
                        className="h-7 w-7 flex items-center justify-center rounded-full text-[#54656f] hover:text-red-500 hover:bg-red-50 transition-colors shrink-0"
                        title="Remover do cardápio de hoje"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    {/* Nivel buttons */}
                    <div className="flex gap-1.5 ml-5">
                      {NIVEL_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          disabled={isUpdating}
                          onClick={() => handleNivelChange(menuItem._id, opt.value)}
                          className={cn(
                            "px-3 py-1 rounded-full text-[12px] font-medium transition-colors disabled:opacity-60",
                            nivel === opt.value ? opt.active : opt.inactive
                          )}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Section B — Adicionar ao cardápio */}
        <div data-id="add-section" className="bg-white rounded-xl border border-[#e9edef] overflow-hidden">
          <div className="px-6 py-4 border-b border-[#e9edef]">
            <h2 className="text-[15px] font-medium text-[#111b21]">Adicionar ao cardápio</h2>
            <p className="text-[13px] text-[#54656f] mt-0.5">Toque no item para adicionar hoje</p>
          </div>

          {/* Search */}
          <div className="px-4 py-3 border-b border-[#e9edef]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#54656f] pointer-events-none" />
              <input
                data-id="add-search-input"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar item..."
                className="w-full pl-9 pr-9 py-2 rounded-lg border border-[#e9edef] text-[13px] text-[#111b21] placeholder:text-[#54656f] focus:outline-none focus:border-[#25d366]"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#54656f] hover:text-[#111b21] transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {loading && (
            <div className="px-6 py-8 text-center text-[13px] text-[#54656f]">Carregando...</div>
          )}

          {!loading && groupedAvailable.length === 0 && (
            <div data-id="add-empty" className="px-6 py-8 text-center text-[13px] text-[#54656f]">
              {search
                ? `Nenhum resultado para "${search}"`
                : "Todos os itens já estão no cardápio de hoje"}
            </div>
          )}

          {!loading && groupedAvailable.length > 0 && (
            <div data-id="add-list">
              {groupedAvailable.map(({ cat, items }) => (
                <div key={cat?._id || "sem-categoria"}>
                  {/* Group header */}
                  <div className="flex items-center gap-2 px-6 py-2 bg-[#f9fafb] border-b border-[#e9edef]">
                    {cat?.cor && <ColorDot cor={cat.cor} />}
                    <span className="text-[12px] font-semibold text-[#54656f] uppercase tracking-wider">
                      {cat?.nome || "Sem categoria"}
                    </span>
                  </div>
                  <div className="divide-y divide-[#e9edef]">
                    {items.map((item) => (
                      <button
                        data-id={`add-item-${item._id}`}
                        key={item._id}
                        type="button"
                        onClick={() => handleAdd(item._id)}
                        className="w-full flex items-center gap-3 px-6 py-3 text-left hover:bg-[#f0f2f5] active:bg-[#e9edef] transition-colors"
                      >
                        {item.categoria?.cor && <ColorDot cor={item.categoria.cor} />}
                        <div className="flex-1 min-w-0">
                          <p className="text-[14px] text-[#111b21] truncate">{item.nome}</p>
                          {item.categoria?.nome && (
                            <p className="text-[12px] text-[#54656f]">{item.categoria.nome}</p>
                          )}
                        </div>
                        <span className="text-[13px] font-semibold text-[#111b21] tabular-nums shrink-0">
                          R$&nbsp;{formatPrice(item.preco)}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
