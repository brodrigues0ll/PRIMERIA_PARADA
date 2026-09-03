"use client";
import { useState, useEffect, useCallback } from "react";
import { ArrowLeft, Plus, Pencil, Trash2, Check } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const COLOR_PRESETS = [
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#14b8a6",
  "#3b82f6",
  "#a855f7",
  "#ec4899",
];

function CategoriaForm({ initial, onSave, onCancel, saving }) {
  const [nome, setNome] = useState(initial?.nome || "");
  const [cor, setCor] = useState(initial?.cor || "");
  const [ordem, setOrdem] = useState(initial?.ordem ?? "");

  const isEdit = !!initial;

  return (
    <div data-id="categoria-form" className="px-6 py-4 border-t border-[#e9edef] flex flex-col gap-4 bg-[#f9fafb]">
      <div>
        <p className="text-[12px] font-medium text-[#54656f] mb-2">Cor da categoria</p>
        <div data-id="categoria-color-picker" className="flex flex-wrap gap-2">
          {COLOR_PRESETS.map((hex) => {
            const isSelected = cor === hex;
            return (
              <button
                key={hex}
                type="button"
                onClick={() => setCor(hex)}
                className={cn(
                  "h-8 w-8 rounded-full flex items-center justify-center transition-all hover:scale-110",
                  isSelected ? "ring-2 ring-offset-2 ring-[#111b21]" : ""
                )}
                style={{ backgroundColor: hex }}
                title={hex}
              >
                {isSelected && <Check className="h-4 w-4 text-white" />}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <p className="text-[12px] font-medium text-[#54656f]">Nome *</p>
        <input
          data-id="categoria-nome-input"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") onSave({ nome, cor, ordem });
            if (e.key === "Escape") onCancel();
          }}
          placeholder="Ex: Bebidas, Pratos, Sobremesas..."
          autoFocus
          className="w-full rounded-lg border border-[#e9edef] px-3 py-2 text-[13px] text-[#111b21] placeholder:text-[#54656f] focus:outline-none focus:border-[#25d366]"
        />
      </div>

      <div className="flex flex-col gap-1">
        <p className="text-[12px] font-medium text-[#54656f]">Ordem de exibição</p>
        <input
          data-id="categoria-ordem-input"
          type="number"
          value={ordem}
          onChange={(e) => setOrdem(e.target.value)}
          placeholder="0"
          min="0"
          className="w-full rounded-lg border border-[#e9edef] px-3 py-2 text-[13px] text-[#111b21] placeholder:text-[#54656f] focus:outline-none focus:border-[#25d366]"
        />
      </div>

      {cor && nome.trim() && (
        <div data-id="categoria-preview" className="flex items-center gap-2 px-3 py-2 bg-[#f0f2f5] rounded-lg">
          <div className="h-4 w-4 rounded-full shrink-0" style={{ backgroundColor: cor }} />
          <span className="text-[13px] text-[#111b21]">{nome.trim()}</span>
          {ordem !== "" && (
            <span className="ml-auto text-[12px] text-[#54656f]">#{ordem}</span>
          )}
        </div>
      )}

      <div className="flex gap-2">
        <button
          data-id="save-categoria-button"
          type="button"
          onClick={() => onSave({ nome, cor, ordem })}
          disabled={!nome.trim() || saving}
          className="flex-1 py-2 bg-[#25d366] text-white rounded-lg text-[13px] font-medium hover:bg-[#20c55e] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? "Salvando..." : isEdit ? "Salvar alterações" : "Salvar categoria"}
        </button>
        <button
          data-id="cancel-categoria-button"
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-[#e9edef] text-[#54656f] rounded-lg text-[13px] hover:bg-[#f5f6f6] transition-colors"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}

export default function CategoriasPage() {
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);

  const fetchCategorias = useCallback(async () => {
    try {
      const res = await fetch("/api/categorias");
      const data = await res.json();
      if (res.ok) setCategorias(Array.isArray(data) ? data : []);
    } catch {
      toast.error("Erro ao carregar categorias");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCategorias(); }, [fetchCategorias]);

  async function handleAdd({ nome, cor, ordem }) {
    if (!nome.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/categorias", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: nome.trim(),
          cor: cor || null,
          ordem: ordem !== "" ? Number(ordem) : 0,
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        toast.error(d.error || "Erro ao criar categoria");
        return;
      }
      const created = await res.json();
      setCategorias((prev) => [...prev, created].sort((a, b) => a.ordem - b.ordem || a.nome.localeCompare(b.nome, "pt-BR")));
      setAdding(false);
      toast.success("Categoria criada");
    } catch {
      toast.error("Erro ao criar categoria");
    } finally {
      setSaving(false);
    }
  }

  async function handleEdit(id, { nome, cor, ordem }) {
    if (!nome.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/categorias/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: nome.trim(),
          cor: cor || null,
          ordem: ordem !== "" ? Number(ordem) : 0,
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        toast.error(d.error || "Erro ao salvar categoria");
        return;
      }
      const updated = await res.json();
      setCategorias((prev) =>
        prev.map((c) => (c._id === id ? updated : c))
            .sort((a, b) => a.ordem - b.ordem || a.nome.localeCompare(b.nome, "pt-BR"))
      );
      setEditingId(null);
      toast.success("Categoria atualizada");
    } catch {
      toast.error("Erro ao salvar categoria");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm("Remover esta categoria?")) return;
    try {
      const res = await fetch(`/api/categorias/${id}`, { method: "DELETE" });
      if (res.status === 409) {
        toast.error("Essa categoria possui itens vinculados");
        return;
      }
      if (!res.ok) {
        toast.error("Erro ao remover categoria");
        return;
      }
      setCategorias((prev) => prev.filter((c) => c._id !== id));
      toast.success("Categoria removida");
    } catch {
      toast.error("Erro ao remover categoria");
    }
  }

  const formOpen = adding || editingId !== null;

  return (
    <div data-id="categorias-page" className="min-h-screen bg-[#f0f2f5]">
      {/* Header */}
      <div
        data-id="categorias-header"
        className="sticky top-0 z-10 bg-white border-b border-[#e9edef] h-[60px] flex items-center gap-4 px-6"
      >
        <Link
          data-id="categorias-back-button"
          href="/price-table"
          className="h-8 w-8 flex items-center justify-center rounded-full text-[#54656f] hover:bg-[#f0f2f5] transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-[17px] font-medium text-[#111b21]">Categorias do Cardápio</h1>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        <div data-id="categorias-card" className="bg-white rounded-xl border border-[#e9edef] overflow-hidden">
          {/* Section header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#e9edef]">
            <div>
              <h2 className="text-[15px] font-medium text-[#111b21]">Categorias</h2>
              <p className="text-[13px] text-[#54656f] mt-0.5">
                Organize os itens do cardápio por categoria
              </p>
            </div>
            {!formOpen && (
              <button
                data-id="add-categoria-button"
                type="button"
                onClick={() => setAdding(true)}
                className="flex items-center gap-1.5 px-3 py-2 bg-[#25d366] text-white rounded-lg text-[13px] font-medium hover:bg-[#20c55e] transition-colors shrink-0"
              >
                <Plus className="h-4 w-4" />
                Adicionar
              </button>
            )}
          </div>

          {/* Loading */}
          {loading && (
            <div className="px-6 py-8 text-center text-[13px] text-[#54656f]">
              Carregando...
            </div>
          )}

          {/* Empty state */}
          {!loading && categorias.length === 0 && !formOpen && (
            <div data-id="categorias-empty" className="px-6 py-8 text-center text-[13px] text-[#54656f]">
              Nenhuma categoria criada
            </div>
          )}

          {/* List */}
          {!loading && categorias.length > 0 && (
            <div data-id="categorias-list" className="divide-y divide-[#e9edef]">
              {categorias.map((cat) => (
                <div key={cat._id}>
                  {/* Normal row */}
                  {editingId !== cat._id && (
                    <div data-id={`categoria-item-${cat._id}`} className="flex items-center gap-3 px-6 py-3">
                      {/* Color dot */}
                      <div
                        className="h-4 w-4 rounded-full shrink-0 border border-black/10"
                        style={{ backgroundColor: cat.cor || "#d1d5db" }}
                      />
                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <span className="text-[14px] text-[#111b21]">{cat.nome}</span>
                      </div>
                      {/* Ordem badge */}
                      <span className="text-[12px] text-[#54656f] tabular-nums w-6 text-right shrink-0">
                        #{cat.ordem}
                      </span>
                      {/* Actions */}
                      <button
                        data-id={`categoria-edit-button-${cat._id}`}
                        type="button"
                        onClick={() => { setEditingId(cat._id); setAdding(false); }}
                        className="h-7 w-7 flex items-center justify-center rounded-full text-[#54656f] hover:text-[#111b21] hover:bg-[#f0f2f5] transition-colors"
                        title="Editar"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        data-id={`categoria-delete-button-${cat._id}`}
                        type="button"
                        onClick={() => handleDelete(cat._id)}
                        className="h-7 w-7 flex items-center justify-center rounded-full text-[#54656f] hover:text-red-500 hover:bg-red-50 transition-colors"
                        title="Remover"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}

                  {/* Inline edit form */}
                  {editingId === cat._id && (
                    <CategoriaForm
                      initial={cat}
                      saving={saving}
                      onSave={(vals) => handleEdit(cat._id, vals)}
                      onCancel={() => setEditingId(null)}
                    />
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Add form */}
          {adding && (
            <CategoriaForm
              saving={saving}
              onSave={handleAdd}
              onCancel={() => setAdding(false)}
            />
          )}
        </div>
      </div>
    </div>
  );
}
