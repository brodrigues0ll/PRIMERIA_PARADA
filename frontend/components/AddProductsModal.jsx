"use client";
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { Search, Plus, ChevronLeft, UserPlus } from "lucide-react";
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
import { cn, formatPrice } from "@/lib/utils";

function NivelBadge({ nivel }) {
  if (!nivel || nivel === "muito") return null;
  if (nivel === "pouco") return <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700">Pouco</span>;
  if (nivel === "esgotado") return <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-red-100 text-red-600">Esgotado</span>;
  return null;
}

export default function AddProductsModal({ open, onClose, comandaId, onAdded, isGrupo, pagantes = [] }) {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);
  const [usingDailyMenu, setUsingDailyMenu] = useState(false);

  // fluxo em 2 etapas para grupo
  const [step, setStep] = useState("items"); // "items" | "pagante"
  const [pendingItem, setPendingItem] = useState(null);
  const [novoPagante, setNovoPagante] = useState("");
  const novoRef = useRef(null);

  useEffect(() => {
    if (!open) { setStep("items"); setPendingItem(null); setNovoPagante(""); return; }
    setLoading(true);
    fetch("/api/cardapio/hoje")
      .then((r) => r.json())
      .then((d) => {
        if (d.itens && d.itens.length > 0) {
          setUsingDailyMenu(true);
          setItems(d.itens.map((i) => ({ ...i.menuItem, nivel: i.nivel })));
        } else {
          setUsingDailyMenu(false);
          return fetch("/api/cardapio")
            .then((r) => r.json())
            .then((d2) => { if (d2.data) setItems(d2.data); });
        }
      })
      .catch(() => {
        setUsingDailyMenu(false);
        return fetch("/api/cardapio")
          .then((r) => r.json())
          .then((d2) => { if (d2.data) setItems(d2.data); });
      })
      .finally(() => setLoading(false));
  }, [open]);

  async function addItem(menuItemId, pagante) {
    setAdding(true);
    try {
      const res = await fetch(`/api/comandas/${comandaId}/pedidos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ menuItemId, pagante: pagante ?? null }),
      });
      if (res.ok) {
        toast.success(pendingItem?.nome ?? "Item adicionado");
        onAdded?.();
      }
    } catch {
      toast.error("Erro ao adicionar item");
    } finally {
      setAdding(false);
      setStep("items");
      setPendingItem(null);
      setNovoPagante("");
    }
  }

  async function addPaganteEItem(nome) {
    // Salva novo pagante na comanda + adiciona item
    const nomeTrimmed = nome.trim();
    if (!nomeTrimmed) return;
    setAdding(true);
    try {
      const novaLista = pagantes.includes(nomeTrimmed)
        ? pagantes
        : [...pagantes, nomeTrimmed];
      await fetch(`/api/comandas/${comandaId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "pagantes", pagantes: novaLista }),
      });
      await addItem(pendingItem._id, nomeTrimmed);
    } catch {
      toast.error("Erro ao salvar pagante");
      setAdding(false);
    }
  }

  function handleAdd(item) {
    if (isGrupo) {
      setPendingItem(item);
      setStep("pagante");
    } else {
      setPendingItem(item);
      addItem(item._id, null);
    }
  }

  const filtered = items
    .filter((i) => i.nome.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => a.nome.localeCompare(b.nome));

  // Build grouped structure for daily menu
  const groupedFiltered = usingDailyMenu
    ? filtered.reduce((acc, item) => {
        const cat = item.categoria?.nome ?? "Sem categoria";
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(item);
        return acc;
      }, {})
    : null;

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent data-id="add-products-modal" className="bg-card border-border sm:max-w-md flex flex-col max-h-[85vh]">

        {/* ── Etapa 1: selecionar item ── */}
        {step === "items" && (
          <>
            <DialogHeader>
              <DialogTitle>Adicionar item</DialogTitle>
            </DialogHeader>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                data-id="products-search-input"
                className="pl-9 bg-background border-input"
                placeholder="Buscar produto..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                autoFocus
              />
            </div>
            <div data-id="products-list" className="flex flex-col overflow-y-auto flex-1 -mx-6 px-6">
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
              {/* Daily menu: grouped by category */}
              {!loading && usingDailyMenu && groupedFiltered && Object.entries(groupedFiltered).map(([cat, catItems]) => (
                <div key={cat}>
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider pt-4 pb-1">{cat}</p>
                  {catItems.map((item, i) => {
                    const esgotado = item.nivel === "esgotado";
                    return (
                      <div key={item._id} data-id={`product-option-${item._id}`}>
                        <div className={cn("flex items-center justify-between py-3", esgotado && "opacity-50")}>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <p className="text-sm font-medium text-foreground">{item.nome}</p>
                              <NivelBadge nivel={item.nivel} />
                            </div>
                            <p className="text-xs text-muted-foreground tabular-nums">
                              R$ {formatPrice(item.preco)}
                            </p>
                          </div>
                          <Button
                            data-id="add-selected-products-button"
                            size="sm"
                            className="bg-primary hover:bg-primary/90 gap-1"
                            onClick={() => handleAdd(item)}
                            disabled={adding || esgotado}
                            style={esgotado ? { pointerEvents: "none", cursor: "not-allowed" } : undefined}
                          >
                            <Plus className="h-3.5 w-3.5" />
                            Add
                          </Button>
                        </div>
                        {i < catItems.length - 1 && <Separator />}
                      </div>
                    );
                  })}
                </div>
              ))}
              {/* Fallback: alphabetical list without nivel */}
              {!loading && !usingDailyMenu && filtered.map((item, i) => (
                <div key={item._id} data-id={`product-option-${item._id}`}>
                  <div className="flex items-center justify-between py-3">
                    <div>
                      <p className="text-sm font-medium text-foreground">{item.nome}</p>
                      <p className="text-xs text-muted-foreground tabular-nums">
                        R$ {formatPrice(item.preco)}
                      </p>
                    </div>
                    <Button
                      data-id="add-selected-products-button"
                      size="sm"
                      className="bg-primary hover:bg-primary/90 gap-1"
                      onClick={() => handleAdd(item)}
                      disabled={adding}
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Add
                    </Button>
                  </div>
                  {i < filtered.length - 1 && <Separator />}
                </div>
              ))}
            </div>
          </>
        )}

        {/* ── Etapa 2: selecionar pagante ── */}
        {step === "pagante" && pendingItem && (
          <>
            <DialogHeader>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => { setStep("items"); setPendingItem(null); setNovoPagante(""); }}
                  className="h-7 w-7 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <DialogTitle className="text-sm font-semibold leading-snug">
                  Para quem é&nbsp;
                  <span className="text-primary">{pendingItem.nome}</span>?
                </DialogTitle>
              </div>
            </DialogHeader>

            <div className="space-y-4 overflow-y-auto flex-1">
              {/* Pagantes existentes */}
              {pagantes.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {pagantes.map((nome) => (
                    <button
                      key={nome}
                      type="button"
                      disabled={adding}
                      onClick={() => addItem(pendingItem._id, nome)}
                      className={cn(
                        "px-4 py-2 rounded-xl border border-border text-sm font-medium transition-colors",
                        "bg-card hover:bg-primary hover:text-primary-foreground hover:border-primary",
                        adding && "opacity-50 pointer-events-none"
                      )}
                    >
                      {nome}
                    </button>
                  ))}
                </div>
              )}

              {pagantes.length > 0 && <Separator />}

              {/* Novo pagante */}
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <UserPlus className="h-3.5 w-3.5" />
                  Novo pagante
                </p>
                <div className="flex gap-2">
                  <Input
                    ref={novoRef}
                    placeholder="Nome do pagante..."
                    value={novoPagante}
                    onChange={(e) => setNovoPagante(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && novoPagante.trim()) addPaganteEItem(novoPagante);
                    }}
                    autoFocus={pagantes.length === 0}
                    disabled={adding}
                    className="bg-background"
                  />
                  <Button
                    onClick={() => addPaganteEItem(novoPagante)}
                    disabled={adding || !novoPagante.trim()}
                    className="bg-primary text-primary-foreground shrink-0"
                  >
                    {adding ? "..." : "Confirmar"}
                  </Button>
                </div>
              </div>

              <Separator />

              {/* Sem pagante */}
              <button
                type="button"
                disabled={adding}
                onClick={() => addItem(pendingItem._id, null)}
                className="w-full text-sm text-muted-foreground hover:text-foreground py-1 transition-colors disabled:opacity-40"
              >
                Adicionar sem pagante
              </button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
