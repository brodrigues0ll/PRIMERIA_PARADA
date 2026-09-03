"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Link2, RefreshCw, X, Unlink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const STATUS_STYLES = {
  livre: {
    card: "border-emerald-500/30 bg-emerald-500/10",
    dot: "bg-emerald-500",
    text: "text-emerald-500",
    badge: "text-emerald-500 border-emerald-500/30",
    label: "Livre",
  },
  ocupada: {
    card: "border-rose-500/30 bg-rose-500/10",
    dot: "bg-rose-500",
    text: "text-rose-500",
    badge: "text-rose-500 border-rose-500/30",
    label: "Ocupada",
  },
  grupo: {
    card: "border-amber-500/30 bg-amber-500/10",
    dot: "bg-amber-500",
    text: "text-amber-500",
    badge: "text-amber-500 border-amber-500/30",
    label: "Grupo",
  },
};

function MesaCardSkeleton() {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 space-y-2">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-3 w-16" />
      <Skeleton className="h-5 w-12 rounded-full" />
    </div>
  );
}

export default function SalaoPage() {
  const router = useRouter();

  const [mesas, setMesas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [modoJuntar, setModoJuntar] = useState(false);
  const [selecionadas, setSelecionadas] = useState([]);

  const [modalCriar, setModalCriar] = useState(false);
  const [mesaSelecionada, setMesaSelecionada] = useState(null);
  const [nomeComanda, setNomeComanda] = useState("");
  const [criando, setCriando] = useState(false);

  const [modalGrupo, setModalGrupo] = useState(false);
  const [grupoSelecionado, setGrupoSelecionado] = useState(null);
  const [desfazendo, setDesfazendo] = useState(false);

  const [modalJuntar, setModalJuntar] = useState(false);
  const [nomeGrupo, setNomeGrupo] = useState("");
  const [juntando, setJuntando] = useState(false);

  const fetchMesas = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const res = await fetch("/api/salao");
      if (!res.ok) throw new Error("Erro ao carregar salão");
      const json = await res.json();
      setMesas(json.data ?? []);
    } catch {
      toast.error("Não foi possível carregar o salão");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchMesas();
  }, [fetchMesas]);

  function handleRefresh() {
    fetchMesas(true);
  }

  function toggleModoJuntar() {
    if (modoJuntar) {
      setSelecionadas([]);
      setModoJuntar(false);
    } else {
      setModoJuntar(true);
    }
  }

  function toggleSelecao(mesaId) {
    setSelecionadas((prev) =>
      prev.includes(mesaId) ? prev.filter((id) => id !== mesaId) : [...prev, mesaId]
    );
  }

  // Mesas com grupos fundidos em uma única entrada
  const displayItems = (() => {
    const seenGrupos = new Set();
    return mesas.reduce((acc, item) => {
      if (item.status === "grupo") {
        if (seenGrupos.has(item.grupoId)) return acc;
        seenGrupos.add(item.grupoId);
        const grupoMesas = mesas.filter((m) => m.grupoId === item.grupoId);
        const nomes = grupoMesas.map((m) => m.mesa.nome);
        const nomeDisplay =
          nomes.length === 2
            ? `${nomes[0]} e ${nomes[1]}`
            : `${nomes.slice(0, -1).join(", ")} e ${nomes[nomes.length - 1]}`;
        acc.push({ ...item, nomeDisplay, mesasDoGrupo: grupoMesas });
      } else {
        acc.push(item);
      }
      return acc;
    }, []);
  })();

  function handleTapMesa(item) {
    const { mesa, status, comandaId, grupoId, comandaNome, mesasDoGrupo } = item;

    if (modoJuntar) {
      if (status === "livre") toggleSelecao(mesa._id);
      return;
    }

    if (status === "livre") {
      setMesaSelecionada(mesa);
      setNomeComanda(mesa.nome);
      setModalCriar(true);
      return;
    }

    if (status === "ocupada") {
      router.push(`/orders/${comandaId}`);
      return;
    }

    if (status === "grupo") {
      const grupo = mesasDoGrupo ?? mesas.filter((m) => m.grupoId === grupoId);
      setGrupoSelecionado({ grupoId, comandaId, comandaNome, mesasDoGrupo: grupo });
      setModalGrupo(true);
    }
  }

  async function handleCriarComanda(e) {
    e.preventDefault();
    if (!nomeComanda.trim()) return;
    setCriando(true);
    try {
      const res = await fetch("/api/comandas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome: nomeComanda.trim(), mesaId: mesaSelecionada._id }),
      });
      if (!res.ok) throw new Error("Erro ao criar comanda");
      const json = await res.json();
      toast.success("Comanda criada!");
      setModalCriar(false);
      router.push(`/orders/${json.data?._id ?? json._id}`);
    } catch {
      toast.error("Não foi possível criar a comanda");
    } finally {
      setCriando(false);
    }
  }

  async function handleDesfazerGrupo() {
    if (!grupoSelecionado?.grupoId) return;
    setDesfazendo(true);
    try {
      const res = await fetch(`/api/grupos-mesas/${grupoSelecionado.grupoId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Erro ao desfazer junção");
      toast.success("Junção desfeita!");
      setModalGrupo(false);
      setGrupoSelecionado(null);
      fetchMesas(true);
    } catch {
      toast.error("Não foi possível desfazer a junção");
    } finally {
      setDesfazendo(false);
    }
  }

  function handleAbrirModalJuntar() {
    if (selecionadas.length < 2) return;
    setNomeGrupo("");
    setModalJuntar(true);
  }

  async function handleJuntarMesas(e) {
    e.preventDefault();
    if (!nomeGrupo.trim() || selecionadas.length < 2) return;
    setJuntando(true);
    try {
      const res = await fetch("/api/grupos-mesas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mesaIds: selecionadas, nome: nomeGrupo.trim() }),
      });
      if (!res.ok) throw new Error("Erro ao juntar mesas");
      const json = await res.json();
      toast.success("Mesas juntadas!");
      setModalJuntar(false);
      setModoJuntar(false);
      setSelecionadas([]);
      router.push(`/orders/${json.comanda?._id ?? json.data?.comanda?._id}`);
    } catch {
      toast.error("Não foi possível juntar as mesas");
    } finally {
      setJuntando(false);
    }
  }

  const mesasGrupo = grupoSelecionado?.mesasDoGrupo ?? [];

  return (
    <div data-id="salao-page" className="min-h-[calc(100vh-3.5rem)] bg-background pb-32">
      {/* Header de ações */}
      <div data-id="salao-header" className="sticky top-14 z-20 bg-background/90 backdrop-blur-md border-b border-border">
        <div className="flex items-center justify-between px-4 py-2.5 gap-2">
          <span data-id="salao-mesa-count" className="text-sm font-semibold text-foreground">
            {mesas.length} mesa{mesas.length !== 1 ? "s" : ""}
          </span>
          <div className="flex items-center gap-1">
            <Button
              data-id="salao-refresh-button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
            </Button>
            <Button
              data-id="salao-toggle-juntar-button"
              variant={modoJuntar ? "default" : "ghost"}
              size="icon"
              className={cn(
                "h-8 w-8",
                modoJuntar
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
              onClick={toggleModoJuntar}
            >
              {modoJuntar ? <X className="h-4 w-4" /> : <Link2 className="h-4 w-4" />}
            </Button>
          </div>
        </div>
        {modoJuntar && (
          <div data-id="salao-juntar-hint" className="px-4 pb-2">
            <p className="text-xs text-muted-foreground">
              Selecione as mesas livres para juntar
            </p>
          </div>
        )}
      </div>

      {/* Grid de mesas */}
      <div data-id="salao-grid-wrapper" className="px-4 pt-4">
        {loading ? (
          <div data-id="salao-grid-skeleton" className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <MesaCardSkeleton key={i} />
            ))}
          </div>
        ) : mesas.length === 0 ? (
          <div data-id="salao-empty-state" className="flex flex-col items-center justify-center py-20 text-center gap-2">
            <p className="text-base font-semibold text-foreground">Nenhuma mesa cadastrada</p>
            <p className="text-sm text-muted-foreground">Configure o salão em Configurações</p>
          </div>
        ) : (
          <div data-id="mesa-grid" className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {displayItems.map((item) => {
              const { mesa, status, comandaNome, nomeDisplay } = item;
              const style = STATUS_STYLES[status] ?? STATUS_STYLES.livre;
              const isSelected = selecionadas.includes(mesa._id);
              const isDisabledInJoinMode = modoJuntar && status !== "livre";
              const isGrupoFundido = status === "grupo" && !!nomeDisplay;

              return (
                <button
                  key={isGrupoFundido ? item.grupoId : mesa._id}
                  data-id={isGrupoFundido ? `mesa-card-grupo-${item.grupoId}` : `mesa-card-${mesa._id}`}
                  onClick={() => handleTapMesa(item)}
                  disabled={isDisabledInJoinMode}
                  className={cn(
                    "rounded-2xl border p-4 text-left transition-all duration-150 active:scale-[0.97] w-full",
                    isSelected
                      ? "border-primary bg-primary/10 ring-2 ring-primary"
                      : style.card,
                    isDisabledInJoinMode && "opacity-40 cursor-not-allowed"
                  )}
                >
                  <div className="flex items-start justify-between mb-2">
                    <p className="text-sm font-bold text-foreground leading-tight">
                      {nomeDisplay ?? mesa.nome}
                    </p>
                    <span
                      className={cn(
                        "h-2.5 w-2.5 rounded-full shrink-0 mt-0.5",
                        isSelected ? "bg-primary" : style.dot
                      )}
                    />
                  </div>
                  {!isGrupoFundido && mesa.capacidade && (
                    <p className="text-xs text-muted-foreground mb-2">
                      {mesa.capacidade} lugar{mesa.capacidade !== 1 ? "es" : ""}
                    </p>
                  )}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span
                      className={cn(
                        "text-[10px] font-semibold border rounded-full px-2 py-0.5",
                        isSelected ? "text-primary border-primary/40" : style.badge
                      )}
                    >
                      {isSelected ? "Selecionada" : style.label}
                    </span>
                    {status === "ocupada" && comandaNome && (
                      <span className="text-[10px] text-muted-foreground truncate max-w-[80px]">
                        {comandaNome}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Barra inferior — modo juntar */}
      {modoJuntar && (
        <div data-id="salao-juntar-toolbar" className="fixed bottom-0 left-0 right-0 z-30 bg-background/95 backdrop-blur-md border-t border-border px-4 py-4 flex items-center justify-between gap-3">
          <p data-id="salao-juntar-selection-count" className="text-sm text-foreground font-medium">
            {selecionadas.length} mesa{selecionadas.length !== 1 ? "s" : ""} selecionada{selecionadas.length !== 1 ? "s" : ""}
          </p>
          <div className="flex items-center gap-2">
            <Button
              data-id="salao-juntar-cancel-button"
              variant="outline"
              size="sm"
              onClick={toggleModoJuntar}
            >
              Cancelar
            </Button>
            <Button
              data-id="salao-juntar-confirm-button"
              size="sm"
              className="bg-primary text-primary-foreground"
              disabled={selecionadas.length < 2}
              onClick={handleAbrirModalJuntar}
            >
              Juntar
            </Button>
          </div>
        </div>
      )}

      {/* Modal — criar comanda */}
      <Dialog open={modalCriar} onOpenChange={(v) => { if (!criando) setModalCriar(v); }}>
        <DialogContent data-id="modal-criar-comanda">
          <DialogHeader>
            <DialogTitle>Nova comanda</DialogTitle>
            <DialogDescription>
              Mesa: {mesaSelecionada?.nome}
            </DialogDescription>
          </DialogHeader>
          <form data-id="criar-comanda-form" onSubmit={handleCriarComanda} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label htmlFor="nome-comanda">Nome da comanda</Label>
              <Input
                data-id="criar-comanda-nome-input"
                id="nome-comanda"
                value={nomeComanda}
                onChange={(e) => setNomeComanda(e.target.value)}
                placeholder="Ex: Mesa 1 — João"
                autoFocus
                required
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                data-id="criar-comanda-cancel-button"
                type="button"
                variant="outline"
                onClick={() => setModalCriar(false)}
                disabled={criando}
              >
                Cancelar
              </Button>
              <Button
                data-id="criar-comanda-submit-button"
                type="submit"
                className="bg-primary text-primary-foreground"
                disabled={criando || !nomeComanda.trim()}
              >
                {criando ? "Criando..." : "Criar comanda"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal — grupo de mesas */}
      <Dialog open={modalGrupo} onOpenChange={(v) => { if (!desfazendo) setModalGrupo(v); }}>
        <DialogContent data-id="modal-grupo-mesas">
          <DialogHeader>
            <DialogTitle>Grupo de mesas</DialogTitle>
            {grupoSelecionado?.comandaNome && (
              <DialogDescription>
                Comanda: {grupoSelecionado.comandaNome}
              </DialogDescription>
            )}
          </DialogHeader>
          <div className="mt-2 space-y-3">
            {mesasGrupo.length > 0 && (
              <div data-id="grupo-mesas-list" className="space-y-1.5">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Mesas do grupo
                </p>
                <div className="flex flex-wrap gap-2">
                  {mesasGrupo.map((m) => (
                    <Badge data-id={`grupo-mesa-badge-${m.mesa._id}`} key={m.mesa._id} variant="outline" className="text-amber-500 border-amber-500/30">
                      {m.mesa.nome}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            <Separator />
            <div className="flex justify-end gap-2">
              {grupoSelecionado?.comandaId && (
                <Button
                  data-id="grupo-ver-comanda-button"
                  variant="outline"
                  onClick={() => {
                    setModalGrupo(false);
                    router.push(`/orders/${grupoSelecionado.comandaId}`);
                  }}
                >
                  Ver comanda
                </Button>
              )}
              <Button
                data-id="grupo-desfazer-juncao-button"
                variant="destructive"
                onClick={handleDesfazerGrupo}
                disabled={desfazendo}
                className="gap-1.5"
              >
                <Unlink className="h-3.5 w-3.5" />
                {desfazendo ? "Desfazendo..." : "Desfazer junção"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal — juntar mesas */}
      <Dialog open={modalJuntar} onOpenChange={(v) => { if (!juntando) setModalJuntar(v); }}>
        <DialogContent data-id="modal-juntar-mesas">
          <DialogHeader>
            <DialogTitle>Juntar mesas</DialogTitle>
            <DialogDescription>
              {selecionadas.length} mesas selecionadas
            </DialogDescription>
          </DialogHeader>
          <form data-id="juntar-mesas-form" onSubmit={handleJuntarMesas} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label htmlFor="nome-grupo">Nome do cliente / grupo</Label>
              <Input
                data-id="juntar-mesas-nome-input"
                id="nome-grupo"
                value={nomeGrupo}
                onChange={(e) => setNomeGrupo(e.target.value)}
                placeholder="Ex: Família Silva"
                autoFocus
                required
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                data-id="juntar-mesas-cancel-button"
                type="button"
                variant="outline"
                onClick={() => setModalJuntar(false)}
                disabled={juntando}
              >
                Cancelar
              </Button>
              <Button
                data-id="juntar-mesas-submit-button"
                type="submit"
                className="bg-primary text-primary-foreground"
                disabled={juntando || !nomeGrupo.trim()}
              >
                {juntando ? "Juntando..." : "Juntar mesas"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
