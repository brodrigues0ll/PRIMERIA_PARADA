"use client";
import { useState, useEffect, useCallback } from "react";
import { Plus, Pencil, Trash2, GripVertical, Lock } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

function CategoriaDialog({ open, onClose, categoria, tipo, onSaved }) {
  const [nome, setNome] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) setNome(categoria?.nome ?? "");
  }, [open, categoria]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!nome.trim()) { toast.error("Nome é obrigatório"); return; }
    setSaving(true);
    try {
      const url = categoria ? `/api/plano-contas/${categoria._id}` : "/api/plano-contas";
      const method = categoria ? "PATCH" : "POST";
      const body = categoria ? { nome: nome.trim() } : { nome: nome.trim(), tipo };
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? "Erro ao salvar"); return; }
      toast.success(categoria ? "Categoria atualizada!" : "Categoria criada!");
      onSaved();
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent data-id="categoria-dialog" className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{categoria ? "Editar categoria" : "Nova categoria"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3 py-1">
          <div className="space-y-1">
            <Label className="text-xs">Nome *</Label>
            <Input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Nome da categoria" autoFocus />
          </div>
          <DialogFooter className="pt-1 gap-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={saving}>{saving ? "Salvando..." : "Salvar"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function CategoriaItem({ cat, onEdit, onDelete, dragHandleProps }) {
  return (
    <div
      data-id={`categoria-item-${cat._id}`}
      className="flex items-center gap-2 px-4 py-3"
    >
      <div
        {...dragHandleProps}
        className="shrink-0 cursor-grab active:cursor-grabbing touch-none"
      >
        <GripVertical className="h-4 w-4 text-muted-foreground/50" />
      </div>
      <p className="text-sm flex-1 truncate text-foreground">{cat.nome}</p>
      {cat.sistema && (
        <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
          <Lock className="h-3 w-3" />
          padrão
        </span>
      )}
      {!cat.sistema && (
        <>
          <button
            data-id={`categoria-edit-${cat._id}`}
            onClick={() => onEdit(cat)}
            className="h-7 w-7 rounded-lg flex items-center justify-center hover:bg-accent transition-colors shrink-0"
          >
            <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
          <button
            data-id={`categoria-delete-${cat._id}`}
            onClick={() => onDelete(cat)}
            className="h-7 w-7 rounded-lg flex items-center justify-center hover:bg-accent transition-colors shrink-0"
          >
            <Trash2 className="h-3.5 w-3.5 text-destructive" />
          </button>
        </>
      )}
    </div>
  );
}

function ListaCategoria({ categorias, tipo, onEdit, onDelete, onReorder }) {
  const [dragging, setDragging] = useState(null);
  const [lista, setLista] = useState(categorias);

  useEffect(() => { setLista(categorias); }, [categorias]);

  function onDragStart(e, idx) {
    setDragging(idx);
    e.dataTransfer.effectAllowed = "move";
  }

  function onDragOver(e, idx) {
    e.preventDefault();
    if (dragging === null || dragging === idx) return;
    const next = [...lista];
    const [item] = next.splice(dragging, 1);
    next.splice(idx, 0, item);
    setLista(next);
    setDragging(idx);
  }

  function onDrop() {
    setDragging(null);
    onReorder(lista.map((c) => c._id));
  }

  return (
    <div className="space-y-3">
      {lista.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-8 text-center">
          <p className="text-sm text-muted-foreground">Nenhuma categoria cadastrada</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          {lista.map((cat, i) => (
            <div
              key={cat._id}
              draggable
              onDragStart={(e) => onDragStart(e, i)}
              onDragOver={(e) => onDragOver(e, i)}
              onDrop={onDrop}
              className={cn(dragging === i && "opacity-50")}
            >
              <CategoriaItem
                cat={cat}
                onEdit={onEdit}
                onDelete={onDelete}
                dragHandleProps={{}}
              />
              {i < lista.length - 1 && <Separator />}
            </div>
          ))}
        </div>
      )}
      <Button
        data-id={`add-categoria-${tipo}`}
        variant="outline"
        size="sm"
        className="w-full"
        onClick={() => onEdit(null)}
      >
        <Plus className="h-4 w-4 mr-1.5" />
        Nova categoria de {tipo === "entrada" ? "receita" : "despesa"}
      </Button>
    </div>
  );
}

export default function PlanoContasPage() {
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editando, setEditando] = useState(null);
  const [tipoAtivo, setTipoAtivo] = useState("entrada");

  const fetchCategorias = useCallback(async () => {
    const res = await fetch("/api/plano-contas");
    const data = await res.json();
    if (res.ok) setCategorias(data.data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchCategorias(); }, [fetchCategorias]);

  function handleEdit(cat) { setEditando(cat); setDialogOpen(true); }

  async function handleDelete(cat) {
    const res = await fetch(`/api/plano-contas/${cat._id}`, { method: "DELETE" });
    if (res.ok) { toast.success("Categoria removida"); fetchCategorias(); }
    else {
      const data = await res.json();
      toast.error(data.error ?? "Erro ao remover");
    }
  }

  async function handleReorder(tipo, ids) {
    // Atualiza ordem otimisticamente e depois persiste
    const updates = ids.map((id, i) =>
      fetch(`/api/plano-contas/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ordem: i }),
      })
    );
    await Promise.allSettled(updates);
  }

  const entradas = categorias.filter((c) => c.tipo === "entrada");
  const saidas = categorias.filter((c) => c.tipo === "saida");

  return (
    <div data-id="plano-contas-page" className="space-y-4">
      <h1 className="text-xl font-semibold text-foreground">Plano de Contas</h1>
      <p className="text-xs text-muted-foreground -mt-2">
        Configure as categorias usadas nos lançamentos financeiros.
      </p>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-12 rounded-2xl" />)}
        </div>
      ) : (
        <Tabs value={tipoAtivo} onValueChange={setTipoAtivo}>
          <TabsList className="w-full grid grid-cols-2 mb-4">
            <TabsTrigger value="entrada">Receitas ({entradas.length})</TabsTrigger>
            <TabsTrigger value="saida">Despesas ({saidas.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="entrada">
            <ListaCategoria
              categorias={entradas}
              tipo="entrada"
              onEdit={(cat) => { setTipoAtivo("entrada"); handleEdit(cat); }}
              onDelete={handleDelete}
              onReorder={(ids) => handleReorder("entrada", ids)}
            />
          </TabsContent>
          <TabsContent value="saida">
            <ListaCategoria
              categorias={saidas}
              tipo="saida"
              onEdit={(cat) => { setTipoAtivo("saida"); handleEdit(cat); }}
              onDelete={handleDelete}
              onReorder={(ids) => handleReorder("saida", ids)}
            />
          </TabsContent>
        </Tabs>
      )}

      <CategoriaDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        categoria={editando}
        tipo={tipoAtivo}
        onSaved={fetchCategorias}
      />
    </div>
  );
}
