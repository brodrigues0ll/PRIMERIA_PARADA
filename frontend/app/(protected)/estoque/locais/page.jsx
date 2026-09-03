"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, ToggleLeft, ToggleRight, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const TIPOS = [
  { value: "freezer_bebidas", label: "Freezer de Bebidas", icon: "🥤" },
  { value: "freezer_insumos", label: "Freezer de Insumos", icon: "🥩" },
  { value: "despensa", label: "Despensa", icon: "📦" },
  { value: "geladeira", label: "Geladeira", icon: "❄️" },
  { value: "outro", label: "Outro", icon: "📋" },
];

function tipoInfo(tipo) {
  return TIPOS.find((t) => t.value === tipo) || TIPOS[TIPOS.length - 1];
}

function LocalModal({ open, editando, onClose, onSuccess }) {
  const [nome, setNome] = useState("");
  const [tipo, setTipo] = useState("outro");
  const [descricao, setDescricao] = useState("");
  const [ordem, setOrdem] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setNome(editando?.nome || "");
      setTipo(editando?.tipo || "outro");
      setDescricao(editando?.descricao || "");
      setOrdem(editando?.ordem != null ? String(editando.ordem) : "");
    }
  }, [open, editando]);

  async function handleSalvar(e) {
    e.preventDefault();
    if (!nome.trim()) return;
    setLoading(true);
    try {
      const body = {
        nome: nome.trim(),
        tipo,
        descricao: descricao.trim(),
        ordem: ordem !== "" ? Number(ordem) : 0,
      };
      const res = editando
        ? await fetch(`/api/locais-estoque/${editando._id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          })
        : await fetch("/api/locais-estoque", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Erro ao salvar local");
        return;
      }
      toast.success(editando ? "Local atualizado!" : "Local criado!");
      onSuccess();
      onClose();
    } catch {
      toast.error("Erro ao salvar local");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!loading) onClose(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editando ? "Editar local" : "Novo local de estoque"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSalvar} className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <Label htmlFor="nome-local">Nome</Label>
            <Input
              data-id="local-name-input"
              id="nome-local"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Freezer principal"
              autoFocus
              required
              className="bg-background border-input"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Tipo</Label>
            <Select value={tipo} onValueChange={setTipo}>
              <SelectTrigger className="bg-background border-input">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIPOS.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    <span className="flex items-center gap-2">
                      <span>{t.icon}</span>
                      <span>{t.label}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="descricao-local">
              Descrição <span className="text-muted-foreground font-normal">(opcional)</span>
            </Label>
            <Input
              id="descricao-local"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Descrição do local"
              className="bg-background border-input"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ordem-local">
              Ordem <span className="text-muted-foreground font-normal">(opcional)</span>
            </Label>
            <Input
              id="ordem-local"
              type="number"
              min={0}
              value={ordem}
              onChange={(e) => setOrdem(e.target.value)}
              placeholder="0"
              className="bg-background border-input"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button
              data-id="save-local-button"
              type="submit"
              className="bg-primary text-primary-foreground"
              disabled={loading || !nome.trim()}
            >
              {loading ? "Salvando..." : editando ? "Salvar" : "Criar local"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function LocaisEstoquePage() {
  const [locais, setLocais] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editando, setEditando] = useState(null);
  const router = useRouter();

  const fetchLocais = useCallback(async () => {
    try {
      const res = await fetch("/api/locais-estoque");
      const data = await res.json();
      if (res.ok) setLocais(data.data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchLocais(); }, [fetchLocais]);

  async function handleDesativar(local) {
    if (!confirm(`Desativar "${local.nome}"?`)) return;
    try {
      const res = await fetch(`/api/locais-estoque/${local._id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || "Erro ao desativar local"); return; }
      toast.success("Local desativado");
      fetchLocais();
    } catch {
      toast.error("Erro ao desativar local");
    }
  }

  function abrirNovo() { setEditando(null); setModalOpen(true); }
  function abrirEditar(local) { setEditando(local); setModalOpen(true); }

  return (
    <>
      <div data-id="locais-page" className="pb-28">
        <div data-id="locais-header" className="sticky top-14 z-20 bg-background/90 backdrop-blur-md border-b border-border px-4 py-3 flex items-center justify-between">
          <h1 className="text-base font-semibold text-foreground">Locais de Estoque</h1>
          <Button
            data-id="add-local-button"
            size="sm"
            className="bg-primary text-primary-foreground gap-1.5"
            onClick={abrirNovo}
          >
            <Plus className="h-3.5 w-3.5" />
            Novo local
          </Button>
        </div>

        <div data-id="locais-list" className="px-4 pt-4 flex flex-col gap-3">
          {loading && (
            <>
              {[...Array(4)].map((_, i) => (
                <div key={i} className="rounded-2xl border border-border bg-card p-4 flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-xl" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
              ))}
            </>
          )}

          {!loading && locais.length === 0 && (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="h-14 w-14 rounded-2xl bg-muted flex items-center justify-center mb-4 text-2xl">
                📦
              </div>
              <p className="text-sm font-semibold text-foreground mb-1">Nenhum local cadastrado</p>
              <p className="text-xs text-muted-foreground">Crie o primeiro local de estoque</p>
            </div>
          )}

          {!loading && locais.map((local) => {
            const info = tipoInfo(local.tipo);
            return (
              <div
                key={local._id}
                data-id={`local-item-${local._id}`}
                className="rounded-2xl border border-border bg-card p-4 flex items-center gap-3"
              >
                <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center text-xl shrink-0">
                  {info.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{local.nome}</p>
                  <p className="text-xs text-muted-foreground">{info.label}</p>
                  {local.descricao && (
                    <p className="text-xs text-muted-foreground/70 truncate">{local.descricao}</p>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => router.push(`/estoque?localId=${local._id}`)}
                    className="h-8 w-8 rounded-lg flex items-center justify-center hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
                    title="Ver estoque"
                  >
                    <ArrowRight className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => abrirEditar(local)}
                    className="h-8 w-8 rounded-lg flex items-center justify-center hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
                    title="Editar"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDesativar(local)}
                    className="h-8 w-8 rounded-lg flex items-center justify-center hover:bg-accent transition-colors text-muted-foreground hover:text-destructive"
                    title="Desativar"
                  >
                    <ToggleRight className="h-4 w-4 text-emerald-500" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <LocalModal
        open={modalOpen}
        editando={editando}
        onClose={() => setModalOpen(false)}
        onSuccess={fetchLocais}
      />
    </>
  );
}
