"use client";
import { useState, useEffect, useCallback } from "react";
import { Plus, Pencil, Trash2, Phone, Mail, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";
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
  DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const VAZIO = { nome: "", cnpj: "", telefone: "", email: "", contato: "", observacoes: "" };

function FornecedorDialog({ open, onClose, fornecedor, onSaved }) {
  const [form, setForm] = useState(VAZIO);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) setForm(fornecedor ? { ...VAZIO, ...fornecedor } : VAZIO);
  }, [open, fornecedor]);

  function set(key, val) { setForm((p) => ({ ...p, [key]: val })); }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.nome.trim()) { toast.error("Nome é obrigatório"); return; }
    setSaving(true);
    try {
      const url = fornecedor ? `/api/fornecedores/${fornecedor._id}` : "/api/fornecedores";
      const method = fornecedor ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? "Erro ao salvar"); return; }
      toast.success(fornecedor ? "Fornecedor atualizado!" : "Fornecedor criado!");
      onSaved();
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent data-id="fornecedor-dialog" className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{fornecedor ? "Editar fornecedor" : "Novo fornecedor"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3 py-1">
          <div className="space-y-1">
            <Label className="text-xs">Nome *</Label>
            <Input value={form.nome} onChange={(e) => set("nome", e.target.value)} placeholder="Nome da empresa" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">CNPJ</Label>
              <Input value={form.cnpj} onChange={(e) => set("cnpj", e.target.value)} placeholder="00.000.000/0001-00" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Telefone</Label>
              <Input value={form.telefone} onChange={(e) => set("telefone", e.target.value)} placeholder="(00) 00000-0000" />
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">E-mail</Label>
            <Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="email@fornecedor.com" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Contato (pessoa)</Label>
            <Input value={form.contato} onChange={(e) => set("contato", e.target.value)} placeholder="Nome do representante" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Observações</Label>
            <Input value={form.observacoes} onChange={(e) => set("observacoes", e.target.value)} placeholder="Notas adicionais" />
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

function FornecedorCard({ fornecedor, onEdit, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  const temDetalhes = fornecedor.cnpj || fornecedor.email || fornecedor.contato || fornecedor.observacoes;

  return (
    <div data-id={`fornecedor-card-${fornecedor._id}`} className="rounded-2xl border border-border bg-card overflow-hidden">
      <div className="flex items-start gap-3 px-4 py-3.5">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground">{fornecedor.nome}</p>
          {fornecedor.telefone && (
            <div className="flex items-center gap-1 mt-0.5">
              <Phone className="h-3 w-3 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">{fornecedor.telefone}</p>
            </div>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {temDetalhes && (
            <button
              onClick={() => setExpanded((p) => !p)}
              className="h-8 w-8 rounded-lg flex items-center justify-center hover:bg-accent transition-colors"
            >
              {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
            </button>
          )}
          <button
            data-id={`fornecedor-edit-${fornecedor._id}`}
            onClick={() => onEdit(fornecedor)}
            className="h-8 w-8 rounded-lg flex items-center justify-center hover:bg-accent transition-colors"
          >
            <Pencil className="h-4 w-4 text-muted-foreground" />
          </button>
          <button
            data-id={`fornecedor-delete-${fornecedor._id}`}
            onClick={() => onDelete(fornecedor)}
            className="h-8 w-8 rounded-lg flex items-center justify-center hover:bg-accent transition-colors"
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </button>
        </div>
      </div>

      {expanded && temDetalhes && (
        <>
          <Separator />
          <div className="px-4 py-3 space-y-1.5 text-xs">
            {fornecedor.cnpj && <p><span className="text-muted-foreground">CNPJ: </span>{fornecedor.cnpj}</p>}
            {fornecedor.email && (
              <div className="flex items-center gap-1">
                <Mail className="h-3 w-3 text-muted-foreground" />
                <p className="text-foreground">{fornecedor.email}</p>
              </div>
            )}
            {fornecedor.contato && <p><span className="text-muted-foreground">Contato: </span>{fornecedor.contato}</p>}
            {fornecedor.observacoes && <p className="text-muted-foreground italic">{fornecedor.observacoes}</p>}
          </div>
        </>
      )}
    </div>
  );
}

export default function FornecedoresPage() {
  const [fornecedores, setFornecedores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editando, setEditando] = useState(null);
  const [busca, setBusca] = useState("");

  const fetchFornecedores = useCallback(async () => {
    const res = await fetch("/api/fornecedores");
    const data = await res.json();
    if (res.ok) setFornecedores(data.data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchFornecedores(); }, [fetchFornecedores]);

  function handleEdit(f) { setEditando(f); setDialogOpen(true); }
  function handleNew() { setEditando(null); setDialogOpen(true); }

  async function handleDelete(f) {
    const res = await fetch(`/api/fornecedores/${f._id}`, { method: "DELETE" });
    if (res.ok) { toast.success("Fornecedor removido"); fetchFornecedores(); }
    else toast.error("Erro ao remover");
  }

  const lista = fornecedores.filter((f) =>
    !busca || f.nome.toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <div data-id="fornecedores-page" className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-foreground">Fornecedores</h1>
        <Button data-id="add-fornecedor-button" size="sm" onClick={handleNew}>
          <Plus className="h-4 w-4 mr-1.5" />
          Novo
        </Button>
      </div>

      <Input
        data-id="fornecedores-search"
        placeholder="Buscar fornecedor..."
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
        className="bg-background"
      />

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 rounded-2xl" />)}
        </div>
      ) : lista.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-8 text-center">
          <p className="text-sm text-muted-foreground">
            {busca ? "Nenhum fornecedor encontrado" : "Nenhum fornecedor cadastrado"}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {lista.map((f) => (
            <FornecedorCard
              key={f._id}
              fornecedor={f}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      <FornecedorDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        fornecedor={editando}
        onSaved={fetchFornecedores}
      />
    </div>
  );
}
