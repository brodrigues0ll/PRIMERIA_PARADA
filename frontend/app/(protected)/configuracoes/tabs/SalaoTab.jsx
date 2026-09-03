"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import {
  DndContext,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { useDraggable } from "@dnd-kit/core";
import {
  Plus,
  Pencil,
  ToggleLeft,
  ToggleRight,
  Eraser,
  Undo2,
  Trash2,
  Move,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
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

// ---------- Draggable mesa (modo posicionamento) ----------
function MesaDraggable({ mesa }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: mesa._id });

  const style = {
    position: "absolute",
    left: `${mesa.posicao?.x ?? 50}%`,
    top: `${mesa.posicao?.y ?? 50}%`,
    transform: transform
      ? `translate(-50%, -50%) translate(${transform.x}px, ${transform.y}px)`
      : "translate(-50%, -50%)",
    zIndex: isDragging ? 50 : 2,
    touchAction: "none",
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={cn(
        "flex flex-col items-center gap-0.5 cursor-grab active:cursor-grabbing select-none",
        isDragging && "scale-110 opacity-90 drop-shadow-lg"
      )}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/assets/icons/mesa-4-lugares.svg"
        alt={mesa.nome}
        className="w-16 h-16"
        draggable={false}
      />
      <span className="text-[9px] font-bold text-foreground bg-background/80 backdrop-blur-sm rounded px-1 leading-tight whitespace-nowrap">
        {mesa.nome}
      </span>
    </div>
  );
}

// ---------- Editor de planta baixa (SVG snap-to-grid) ----------
const VB_W = 100;
const VB_H = 60;
const STEP = 5;

const PONTOS = [];
for (let x = 0; x <= VB_W; x += STEP)
  for (let y = 0; y <= VB_H; y += STEP) PONTOS.push({ x, y });

const ESPESSURAS = [
  { label: "Fina", value: 0.5 },
  { label: "Média", value: 1.2 },
  { label: "Grossa", value: 2.5 },
];

function PlantaBaixaEditor({ linhas, onChange }) {
  const [modo, setModo] = useState("linha"); // "linha" | "borracha"
  const [espessura, setEspessura] = useState(1.2);
  const [pontoInicio, setPontoInicio] = useState(null);
  const [pontoHover, setPontoHover] = useState(null);

  function mesmoPonto(a, b) {
    return a && b && a.x === b.x && a.y === b.y;
  }

  function handlePontoClick(p) {
    if (modo !== "linha") return;
    if (!pontoInicio) {
      setPontoInicio(p);
      return;
    }
    if (mesmoPonto(pontoInicio, p)) {
      setPontoInicio(null);
      return;
    }
    onChange([
      ...linhas,
      {
        id: `${Date.now()}`,
        x1: pontoInicio.x,
        y1: pontoInicio.y,
        x2: p.x,
        y2: p.y,
        espessura,
      },
    ]);
    setPontoInicio(null);
  }

  function removerLinha(id) {
    onChange(linhas.filter((l) => l.id !== id));
  }

  function desfazer() {
    if (pontoInicio) {
      setPontoInicio(null);
      return;
    }
    onChange(linhas.slice(0, -1));
  }

  return (
    <div className="space-y-2">
      {/* Toolbar */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          type="button"
          onClick={() => {
            setModo("linha");
            setPontoInicio(null);
          }}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors",
            modo === "linha"
              ? "bg-primary text-primary-foreground border-primary"
              : "border-border text-muted-foreground hover:text-foreground hover:bg-accent"
          )}
        >
          <Pencil className="h-3 w-3" />
          Desenhar
        </button>
        <button
          type="button"
          onClick={() => {
            setModo("borracha");
            setPontoInicio(null);
          }}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors",
            modo === "borracha"
              ? "bg-primary text-primary-foreground border-primary"
              : "border-border text-muted-foreground hover:text-foreground hover:bg-accent"
          )}
        >
          <Eraser className="h-3 w-3" />
          Apagar
        </button>

        {/* Espessura (só visível no modo linha) */}
        {modo === "linha" && (
          <div className="flex items-center gap-1 border border-border rounded-lg overflow-hidden">
            {ESPESSURAS.map((e) => (
              <button
                key={e.value}
                type="button"
                onClick={() => setEspessura(e.value)}
                title={e.label}
                className={cn(
                  "flex items-center justify-center px-2.5 py-1.5 transition-colors",
                  espessura === e.value
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                )}
              >
                <svg width="20" height="10" viewBox="0 0 20 10">
                  <line
                    x1="2"
                    y1="5"
                    x2="18"
                    y2="5"
                    strokeWidth={e.value * 2}
                    strokeLinecap="round"
                    className={
                      espessura === e.value
                        ? "stroke-primary-foreground"
                        : "stroke-current"
                    }
                  />
                </svg>
              </button>
            ))}
          </div>
        )}

        <div className="flex items-center gap-1 ml-auto">
          <button
            type="button"
            onClick={desfazer}
            disabled={linhas.length === 0 && !pontoInicio}
            className="h-7 w-7 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent disabled:opacity-40 transition-colors"
          >
            <Undo2 className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => {
              onChange([]);
              setPontoInicio(null);
            }}
            disabled={linhas.length === 0}
            className="h-7 w-7 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 disabled:opacity-40 transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Canvas SVG */}
      <svg
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        className="w-full rounded-2xl border border-dashed border-border bg-muted/30"
        style={{
          aspectRatio: `${VB_W} / ${VB_H}`,
          display: "block",
          touchAction: "none",
        }}
        onMouseLeave={() => setPontoHover(null)}
      >
        {/* Linhas salvas (visual) */}
        {linhas.map((l) => (
          <line
            key={`v-${l.id}`}
            x1={l.x1}
            y1={l.y1}
            x2={l.x2}
            y2={l.y2}
            strokeWidth={l.espessura ?? 1.2}
            strokeLinecap="round"
            className="stroke-foreground"
          />
        ))}

        {/* Preview da linha em construção */}
        {modo === "linha" &&
          pontoInicio &&
          pontoHover &&
          !mesmoPonto(pontoInicio, pontoHover) && (
            <line
              x1={pontoInicio.x}
              y1={pontoInicio.y}
              x2={pontoHover.x}
              y2={pontoHover.y}
              strokeWidth={espessura}
              strokeLinecap="round"
              strokeDasharray="2 1.5"
              className="stroke-primary pointer-events-none"
            />
          )}

        {/* Pontos de snap (só no modo linha) */}
        {modo === "linha" &&
          PONTOS.map((p) => {
            const isInicio = mesmoPonto(pontoInicio, p);
            const isHover = mesmoPonto(pontoHover, p);
            const r = isInicio ? 1.8 : isHover ? 1.2 : 0.6;
            const colorClass = isInicio
              ? "fill-primary"
              : isHover
                ? "fill-primary/70"
                : "fill-muted-foreground/40";
            return (
              <g key={`${p.x}-${p.y}`}>
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={r}
                  className={`${colorClass} pointer-events-none`}
                />
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={3}
                  fill="transparent"
                  className="cursor-pointer"
                  onClick={() => handlePontoClick(p)}
                  onMouseEnter={() => setPontoHover(p)}
                  onMouseLeave={() => setPontoHover(null)}
                />
              </g>
            );
          })}

        {/* Hit areas das linhas para apagar (renderizadas por cima de tudo) */}
        {modo === "borracha" &&
          linhas.map((l) => (
            <line
              key={`h-${l.id}`}
              x1={l.x1}
              y1={l.y1}
              x2={l.x2}
              y2={l.y2}
              strokeWidth={8}
              strokeLinecap="round"
              stroke="transparent"
              className="cursor-pointer hover:stroke-destructive/30"
              onClick={() => removerLinha(l.id)}
            />
          ))}
      </svg>

      <p className="text-[11px] text-muted-foreground">
        {modo === "linha"
          ? pontoInicio
            ? "Clique em outro ponto para concluir a linha"
            : "Clique em um ponto para iniciar uma linha"
          : "Clique em uma linha para apagá-la"}
      </p>
    </div>
  );
}

// ---------- Componente principal ----------
export default function SalaoTab() {
  const [mesas, setMesas] = useState([]);
  const [loading, setLoading] = useState(true);

  const [linhas, setLinhas] = useState([]);
  const [salvandoLayout, setSalvandoLayout] = useState(false);
  const [modoCanvas, setModoCanvas] = useState("planta"); // "planta" | "mesas"

  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState(null);
  const [nomeMesa, setNomeMesa] = useState("");
  const [capacidadeMesa, setCapacidadeMesa] = useState("");
  const [salvando, setSalvando] = useState(false);

  const canvasRef = useRef(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { delay: 150, tolerance: 8 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 150, tolerance: 8 },
    })
  );

  const fetchMesas = useCallback(async () => {
    setLoading(true);
    try {
      const [resMesas, resLayout] = await Promise.all([
        fetch("/api/mesas?todas=true"),
        fetch("/api/salao/layout"),
      ]);
      const jsonMesas = await resMesas.json();
      const jsonLayout = await resLayout.json();
      setMesas(jsonMesas.data ?? []);
      setLinhas(jsonLayout.data?.linhas ?? []);
    } catch {
      toast.error("Erro ao carregar dados do salão");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMesas();
  }, [fetchMesas]);

  async function salvarLayout(novasLinhas) {
    setSalvandoLayout(true);
    try {
      await fetch("/api/salao/layout", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ linhas: novasLinhas }),
      });
    } catch {
      toast.error("Erro ao salvar layout");
    } finally {
      setSalvandoLayout(false);
    }
  }

  function handleLinhasChange(novasLinhas) {
    setLinhas(novasLinhas);
    salvarLayout(novasLinhas);
  }

  async function handleDragEnd(event) {
    const { active, delta } = event;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const { width, height } = canvas.getBoundingClientRect();
    const mesa = mesas.find((m) => m._id === active.id);
    if (!mesa) return;
    const newX = Math.min(
      100,
      Math.max(0, (mesa.posicao?.x ?? 50) + (delta.x / width) * 100)
    );
    const newY = Math.min(
      100,
      Math.max(0, (mesa.posicao?.y ?? 50) + (delta.y / height) * 100)
    );
    setMesas((prev) =>
      prev.map((m) =>
        m._id === active.id ? { ...m, posicao: { x: newX, y: newY } } : m
      )
    );
    try {
      await fetch("/api/mesas/posicoes", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify([{ id: active.id, x: newX, y: newY }]),
      });
    } catch {
      toast.error("Erro ao salvar posição");
    }
  }

  function abrirModalNova() {
    setEditando(null);
    setNomeMesa("");
    setCapacidadeMesa("");
    setModalAberto(true);
  }
  function abrirModalEditar(mesa) {
    setEditando(mesa);
    setNomeMesa(mesa.nome);
    setCapacidadeMesa(mesa.capacidade != null ? String(mesa.capacidade) : "");
    setModalAberto(true);
  }

  async function handleSalvar(e) {
    e.preventDefault();
    if (!nomeMesa.trim()) return;
    setSalvando(true);
    try {
      const body = {
        nome: nomeMesa.trim(),
        capacidade: capacidadeMesa ? Number(capacidadeMesa) : null,
      };
      const res = editando
        ? await fetch(`/api/mesas/${editando._id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          })
        : await fetch("/api/mesas", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          });
      if (!res.ok) throw new Error();
      toast.success(editando ? "Mesa atualizada!" : "Mesa criada!");
      setModalAberto(false);
      fetchMesas();
    } catch {
      toast.error("Não foi possível salvar a mesa");
    } finally {
      setSalvando(false);
    }
  }

  async function handleToggleAtiva(mesa) {
    try {
      if (mesa.ativa) {
        await fetch(`/api/mesas/${mesa._id}`, { method: "DELETE" });
        toast.success("Mesa desativada");
      } else {
        await fetch(`/api/mesas/${mesa._id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ativa: true }),
        });
        toast.success("Mesa ativada");
      }
      fetchMesas();
    } catch {
      toast.error("Não foi possível alterar o status da mesa");
    }
  }

  const mesasAtivas = mesas.filter((m) => m.ativa);

  return (
    <div className="space-y-8 pb-10" data-id="salao-config-form">
      {/* Seção A — Grid de mesas */}
      <section className="space-y-4" data-id="salao-mesas-section">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-foreground">Mesas</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Gerencie as mesas do salão
            </p>
          </div>
          <Button
            size="sm"
            className="bg-primary text-primary-foreground gap-1.5"
            onClick={abrirModalNova}
            data-id="add-mesa-button"
          >
            <Plus className="h-3.5 w-3.5" />
            Nova mesa
          </Button>
        </div>

        {loading ? (
          <div className="grid grid-cols-3 sm:grid-cols-8 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="aspect-square rounded-2xl" />
            ))}
          </div>
        ) : mesas.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-sm text-muted-foreground">
              Nenhuma mesa cadastrada
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-8 gap-3" data-id="mesas-list">
            {mesas.map((mesa) => (
              <div
                key={mesa._id}
                data-id={`mesa-item-${mesa._id}`}
                className={cn(
                  "aspect-square rounded-2xl border bg-card flex flex-col items-center justify-center gap-1 relative p-2",
                  mesa.ativa ? "border-border" : "border-border/40 opacity-50"
                )}
              >
                <span className="text-sm font-bold text-foreground text-center leading-tight line-clamp-2">
                  {mesa.nome}
                </span>
                {mesa.capacidade && (
                  <span className="text-[10px] text-muted-foreground">
                    {mesa.capacidade} lug.
                  </span>
                )}
                <div
                  className={cn(
                    "absolute top-2 right-2 h-2 w-2 rounded-full",
                    mesa.ativa ? "bg-emerald-500" : "bg-muted-foreground/40"
                  )}
                />
                <div className="absolute bottom-1.5 flex items-center gap-0.5">
                  <button
                    className="h-6 w-6 rounded-lg flex items-center justify-center hover:bg-accent transition-colors"
                    onClick={() => abrirModalEditar(mesa)}
                    data-id={`mesa-editar-button-${mesa._id}`}
                  >
                    <Pencil className="h-3 w-3 text-muted-foreground" />
                  </button>
                  <button
                    className="h-6 w-6 rounded-lg flex items-center justify-center hover:bg-accent transition-colors"
                    onClick={() => handleToggleAtiva(mesa)}
                    data-id={`mesa-toggle-button-${mesa._id}`}
                  >
                    {mesa.ativa ? (
                      <ToggleRight className="h-3.5 w-3.5 text-emerald-500" />
                    ) : (
                      <ToggleLeft className="h-3.5 w-3.5 text-muted-foreground" />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <Separator />

      {/* Seção B — Editor de layout */}
      <section className="space-y-4" data-id="salao-layout-section">
        <div>
          <h2 className="text-base font-bold text-foreground">
            Layout do salão
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Desenhe as paredes e posicione as mesas
          </p>
        </div>

        {/* Toggle de modo */}
        <div className="flex rounded-xl border border-border overflow-hidden w-fit" data-id="salao-layout-modo-toggle">
          <button
            type="button"
            onClick={() => setModoCanvas("planta")}
            className={cn(
              "flex items-center gap-1.5 px-4 py-2 text-xs font-medium transition-colors",
              modoCanvas === "planta"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
            data-id="salao-layout-modo-planta"
          >
            <Pencil className="h-3.5 w-3.5" />
            Planta baixa
          </button>
          <button
            type="button"
            onClick={() => setModoCanvas("mesas")}
            className={cn(
              "flex items-center gap-1.5 px-4 py-2 text-xs font-medium transition-colors",
              modoCanvas === "mesas"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
            data-id="salao-layout-modo-mesas"
          >
            <Move className="h-3.5 w-3.5" />
            Posicionar mesas
          </button>
        </div>

        {modoCanvas === "planta" ? (
          <PlantaBaixaEditor linhas={linhas} onChange={handleLinhasChange} />
        ) : (
          /* Modo posicionamento de mesas — canvas com linhas ao fundo */
          <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
            <div
              ref={canvasRef}
              className="relative w-full rounded-2xl border border-border overflow-hidden bg-muted/30"
              style={{ aspectRatio: `${VB_W} / ${VB_H}` }}
            >
              {/* Planta baixa como fundo */}
              <svg
                viewBox={`0 0 ${VB_W} ${VB_H}`}
                className="absolute inset-0 w-full h-full pointer-events-none"
                preserveAspectRatio="none"
              >
                {linhas.map((l) => (
                  <line
                    key={l.id}
                    x1={l.x1}
                    y1={l.y1}
                    x2={l.x2}
                    y2={l.y2}
                    strokeWidth={l.espessura ?? 1.2}
                    strokeLinecap="round"
                    className="stroke-foreground/30"
                  />
                ))}
              </svg>

              {mesasAtivas.length === 0 ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <p className="text-sm text-muted-foreground">
                    Nenhuma mesa ativa para posicionar
                  </p>
                </div>
              ) : (
                mesasAtivas.map((mesa) => (
                  <MesaDraggable key={mesa._id} mesa={mesa} />
                ))
              )}
            </div>
          </DndContext>
        )}

        {salvandoLayout && (
          <p className="text-[11px] text-muted-foreground">Salvando...</p>
        )}
      </section>

      {/* Modal criar/editar mesa */}
      <Dialog
        open={modalAberto}
        onOpenChange={(v) => {
          if (!salvando) setModalAberto(v);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editando ? "Editar mesa" : "Nova mesa"}</DialogTitle>
            <DialogDescription>
              {editando
                ? `Editando: ${editando.nome}`
                : "Preencha os dados da nova mesa"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSalvar} className="space-y-4 mt-2" data-id="mesa-form">
            <div className="space-y-1.5">
              <Label htmlFor="nome-mesa">Nome</Label>
              <Input
                id="nome-mesa"
                value={nomeMesa}
                onChange={(e) => setNomeMesa(e.target.value)}
                placeholder="Ex: Mesa 1"
                autoFocus
                required
                data-id="mesa-nome-input"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="capacidade-mesa">
                Capacidade{" "}
                <span className="text-muted-foreground font-normal">
                  (opcional)
                </span>
              </Label>
              <Input
                id="capacidade-mesa"
                type="number"
                min={1}
                value={capacidadeMesa}
                onChange={(e) => setCapacidadeMesa(e.target.value)}
                placeholder="Ex: 4"
                data-id="mesa-capacidade-input"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setModalAberto(false)}
                disabled={salvando}
                data-id="mesa-cancelar-button"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="bg-primary text-primary-foreground"
                disabled={salvando || !nomeMesa.trim()}
                data-id="mesa-salvar-button"
              >
                {salvando ? "Salvando..." : editando ? "Salvar" : "Criar mesa"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
