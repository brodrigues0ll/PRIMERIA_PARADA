"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Loader2, X, Check } from "lucide-react";

const PERMISSOES_LABELS = {
  pdv: "PDV",
  orders: "Comandas",
  estoque: "Estoque",
  "price-table": "Cardápio",
  configuracoes: "Configurações",
};

const ALL_PERMISSOES = Object.keys(PERMISSOES_LABELS);

function BottomSheet({ open, onClose, title, children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-card border-t border-border rounded-t-2xl p-6 flex flex-col gap-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <p className="text-base font-semibold text-foreground">{title}</p>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

const BLANK = { nome: "", descricao: "", permissoes: [] };

export default function PermissoesTab() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sheet, setSheet] = useState(null); // null | "novo" | "editar"
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(BLANK);
  const [saving, setSaving] = useState(false);

  async function load() {
    const r = await fetch("/api/grupos-permissao");
    const d = await r.json();
    setGroups(Array.isArray(d) ? d : []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function togglePerm(p) {
    setForm((prev) => ({
      ...prev,
      permissoes: prev.permissoes.includes(p)
        ? prev.permissoes.filter((x) => x !== p)
        : [...prev.permissoes, p],
    }));
  }

  function openNovo() {
    setForm(BLANK);
    setSheet("novo");
  }

  function openEditar(g) {
    setSelected(g);
    setForm({ nome: g.nome, descricao: g.descricao ?? "", permissoes: g.permissoes ?? [] });
    setSheet("editar");
  }

  async function handleSave() {
    if (!form.nome.trim()) {
      toast.error("Nome é obrigatório");
      return;
    }
    setSaving(true);
    try {
      const url = sheet === "novo" ? "/api/grupos-permissao" : `/api/grupos-permissao/${selected._id}`;
      const method = sheet === "novo" ? "POST" : "PATCH";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erro ao salvar");
      toast.success(sheet === "novo" ? "Grupo criado" : "Grupo atualizado");
      setSheet(null);
      load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(g) {
    if (!confirm(`Excluir grupo "${g.nome}"? Os funcionários perderão este grupo.`)) return;
    try {
      const res = await fetch(`/api/grupos-permissao/${g._id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Erro ao excluir");
      toast.success("Grupo removido");
      load();
    } catch (err) {
      toast.error(err.message);
    }
  }

  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2].map((i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            {groups.length} grupo{groups.length !== 1 ? "s" : ""}
          </p>
          <Button size="sm" onClick={openNovo} className="gap-1.5 h-8">
            <Plus className="h-3.5 w-3.5" />
            Novo grupo
          </Button>
        </div>

        {groups.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-sm font-semibold text-foreground mb-1">Nenhum grupo</p>
            <p className="text-xs text-muted-foreground">Crie grupos para controlar o acesso dos funcionários</p>
          </div>
        )}

        {groups.length > 0 && (
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            {groups.map((g, idx) => (
              <div key={g._id}>
                <div className="px-4 py-3.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{g.nome}</p>
                      {g.descricao && (
                        <p className="text-xs text-muted-foreground mt-0.5">{g.descricao}</p>
                      )}
                      <div className="flex flex-wrap gap-1 mt-2">
                        {g.permissoes?.length > 0
                          ? g.permissoes.map((p) => (
                              <span
                                key={p}
                                className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-primary/10 text-primary"
                              >
                                {PERMISSOES_LABELS[p] ?? p}
                              </span>
                            ))
                          : <span className="text-xs text-muted-foreground">Sem permissões</span>
                        }
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => openEditar(g)}
                        className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(g)}
                        className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
                {idx < groups.length - 1 && <Separator />}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Sheet: Criar / Editar grupo */}
      <BottomSheet
        open={sheet === "novo" || sheet === "editar"}
        onClose={() => setSheet(null)}
        title={sheet === "novo" ? "Novo grupo" : `Editar: ${selected?.nome ?? ""}`}
      >
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Nome do grupo</label>
            <Input
              value={form.nome}
              onChange={(e) => setForm((p) => ({ ...p, nome: e.target.value }))}
              placeholder="Ex: Caixa"
              autoFocus
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Descrição <span className="text-muted-foreground font-normal">(opcional)</span></label>
            <Input
              value={form.descricao}
              onChange={(e) => setForm((p) => ({ ...p, descricao: e.target.value }))}
              placeholder="Ex: Acesso ao caixa e PDV"
            />
          </div>

          <Separator />

          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">Permissões</p>
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              {ALL_PERMISSOES.map((p, i) => {
                const active = form.permissoes.includes(p);
                return (
                  <button
                    key={p}
                    onClick={() => togglePerm(p)}
                    className={cn(
                      "w-full flex items-center justify-between px-4 py-3 text-sm transition-colors",
                      i < ALL_PERMISSOES.length - 1 && "border-b border-border",
                      active ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {PERMISSOES_LABELS[p]}
                    <div className={cn(
                      "h-5 w-5 rounded-md border flex items-center justify-center transition-colors",
                      active ? "bg-primary border-primary" : "border-border bg-background"
                    )}>
                      {active && <Check className="h-3 w-3 text-primary-foreground" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setSheet(null)}>Cancelar</Button>
            <Button className="flex-1" disabled={saving} onClick={handleSave}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {sheet === "novo" ? "Criar grupo" : "Salvar"}
            </Button>
          </div>
        </div>
      </BottomSheet>
    </>
  );
}
