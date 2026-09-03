"use client";
import { useState, useEffect } from "react";
import { ArrowLeft, Plus, Trash2, Check, Eye, Pencil, X } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// ── IDB helpers ──────────────────────────────────────────────────────────────
const IDB_NAME = "primeria-wa";
const IDB_VERSION = 1;

function openIDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_NAME, IDB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains("meta")) db.createObjectStore("meta");
    };
    req.onsuccess = (e) => resolve(e.target.result);
    req.onerror = () => reject(req.error);
  });
}

async function idbGet(key) {
  try {
    const db = await openIDB();
    return new Promise((resolve) => {
      const tx = db.transaction("meta", "readonly");
      const req = tx.objectStore("meta").get(key);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(undefined);
    });
  } catch { return undefined; }
}

async function idbSet(key, value) {
  try {
    const db = await openIDB();
    return new Promise((resolve) => {
      const tx = db.transaction("meta", "readwrite");
      tx.objectStore("meta").put(value, key);
      tx.oncomplete = resolve;
      tx.onerror = resolve;
    });
  } catch {}
}

// ── Paleta das 10 cores disponíveis ──────────────────────────────────────────
const COLOR_MAP = {
  red:    "#ef4444",
  orange: "#f97316",
  yellow: "#eab308",
  green:  "#22c55e",
  teal:   "#14b8a6",
  blue:   "#3b82f6",
  purple: "#a855f7",
  pink:   "#ec4899",
  gray:   "#6b7280",
  brown:  "#92400e",
};
const COLOR_KEYS = Object.keys(COLOR_MAP);

async function saveColorLabels(colorLabels) {
  await fetch("/api/whatsapp/config", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ colorLabels }),
  });
}

// ── Formulário de marcador (novo ou edição) ───────────────────────────────────
function MarkerForm({ initialColor, initialLabel, usedColors, onSave, onCancel, saving }) {
  const [color, setColor] = useState(initialColor || "");
  const [label, setLabel] = useState(initialLabel || "");

  const isEdit = !!initialColor;

  return (
    <div className="px-6 py-4 border-t border-[#e9edef] flex flex-col gap-4">
      <div>
        <p className="text-[12px] font-medium text-[#54656f] mb-2">
          {isEdit ? "Alterar cor" : "Escolha uma cor"}
        </p>
        <div className="flex flex-wrap gap-2">
          {COLOR_KEYS.map((key) => {
            const isUsed = usedColors.has(key) && key !== initialColor;
            const isSelected = color === key;
            return (
              <button
                key={key}
                disabled={isUsed}
                onClick={() => setColor(key)}
                className={cn(
                  "h-8 w-8 rounded-full flex items-center justify-center transition-all",
                  isUsed ? "opacity-25 cursor-not-allowed" : "hover:scale-110",
                  isSelected ? "ring-2 ring-offset-2 ring-[#111b21]" : ""
                )}
                style={{ backgroundColor: COLOR_MAP[key] }}
                title={isUsed ? "Cor já em uso" : key}
              >
                {isSelected && <Check className="h-4 w-4 text-white" />}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <p className="text-[12px] font-medium text-[#54656f] mb-1">Nome do marcador</p>
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") onSave(color, label);
            if (e.key === "Escape") onCancel();
          }}
          placeholder="Ex: Urgente, Atendido, Cliente VIP..."
          autoFocus
          className="w-full rounded-lg border border-[#e9edef] px-3 py-2 text-[13px] text-[#111b21] placeholder:text-[#54656f] focus:outline-none focus:border-[#25d366]"
        />
      </div>

      {color && label.trim() && (
        <div className="flex items-center gap-2 px-3 py-2 bg-[#f0f2f5] rounded-lg">
          <div className="h-4 w-4 rounded-full shrink-0" style={{ backgroundColor: COLOR_MAP[color] }} />
          <span className="text-[13px] text-[#111b21]">{label.trim()}</span>
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={() => onSave(color, label)}
          disabled={!color || !label.trim() || saving}
          className="flex-1 py-2 bg-[#25d366] text-white rounded-lg text-[13px] font-medium hover:bg-[#20c55e] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? "Salvando..." : isEdit ? "Salvar alterações" : "Salvar marcador"}
        </button>
        <button
          onClick={onCancel}
          className="px-4 py-2 border border-[#e9edef] text-[#54656f] rounded-lg text-[13px] hover:bg-[#f5f6f6] transition-colors"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}

export default function WhatsAppConfigPage() {
  const [colorLabels, setColorLabels] = useState({});
  const [hiddenChats, setHiddenChats] = useState([]);

  const [addingMarker, setAddingMarker] = useState(false);
  const [editingKey, setEditingKey] = useState(null); // chave do marcador sendo editado
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/whatsapp/config")
      .then((r) => r.json())
      .then((d) => { if (d.colorLabels) setColorLabels(d.colorLabels); })
      .catch(() => {});

    idbGet("hidden_chats").then((list) => {
      if (Array.isArray(list)) setHiddenChats(list.map((jid) => ({ jid })));
    });
  }, []);

  const usedColors = new Set(Object.keys(colorLabels));
  const configuredMarkers = Object.entries(colorLabels);

  function cancelForm() {
    setAddingMarker(false);
    setEditingKey(null);
  }

  async function handleSaveNew(color, label) {
    if (!color || !label.trim()) return;
    setSaving(true);
    try {
      const next = { ...colorLabels, [color]: label.trim() };
      await saveColorLabels(next);
      setColorLabels(next);
      setAddingMarker(false);
      toast.success("Marcador adicionado");
    } catch {
      toast.error("Erro ao salvar");
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveEdit(oldKey, newColor, newLabel) {
    if (!newColor || !newLabel.trim()) return;
    setSaving(true);
    try {
      const next = { ...colorLabels };
      // Remove a chave antiga e insere com nova chave/label
      delete next[oldKey];
      next[newColor] = newLabel.trim();
      await saveColorLabels(next);
      setColorLabels(next);
      setEditingKey(null);
      toast.success("Marcador atualizado");
    } catch {
      toast.error("Erro ao salvar");
    } finally {
      setSaving(false);
    }
  }

  async function deleteMarker(key) {
    try {
      const next = { ...colorLabels };
      delete next[key];
      await saveColorLabels(next);
      setColorLabels(next);
      toast.success("Marcador removido");
    } catch {
      toast.error("Erro ao remover");
    }
  }

  async function unhideChat(jid) {
    const next = hiddenChats.filter((c) => c.jid !== jid);
    setHiddenChats(next);
    await idbSet("hidden_chats", next.map((c) => c.jid));
  }

  const formOpen = addingMarker || editingKey !== null;

  return (
    <div className="min-h-screen bg-[#f0f2f5]">
      {/* Header */}
      <div className="flex items-center gap-4 px-6 h-[60px] bg-white border-b border-[#e9edef] sticky top-0 z-10">
        <Link
          href="/whatsapp"
          className="h-8 w-8 flex items-center justify-center rounded-full text-[#54656f] hover:bg-[#f0f2f5] transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-[17px] font-medium text-[#111b21]">Configurações do WhatsApp</h1>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 flex flex-col gap-6">

        {/* Seção A — Marcadores de conversa */}
        <div className="bg-white rounded-xl border border-[#e9edef] overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#e9edef]">
            <div>
              <h2 className="text-[15px] font-medium text-[#111b21]">Marcadores de Conversa</h2>
              <p className="text-[13px] text-[#54656f] mt-0.5">
                Crie rótulos coloridos para organizar suas conversas
              </p>
            </div>
            {!formOpen && (
              <button
                onClick={() => setAddingMarker(true)}
                className="flex items-center gap-1.5 px-3 py-2 bg-[#25d366] text-white rounded-lg text-[13px] font-medium hover:bg-[#20c55e] transition-colors shrink-0"
              >
                <Plus className="h-4 w-4" />
                Adicionar marcador
              </button>
            )}
          </div>

          {configuredMarkers.length === 0 && !formOpen && (
            <div className="px-6 py-8 text-center text-[13px] text-[#54656f]">
              Nenhum marcador criado ainda
            </div>
          )}

          {configuredMarkers.length > 0 && (
            <div className="divide-y divide-[#e9edef]">
              {configuredMarkers.map(([key, label]) => (
                <div key={key}>
                  {/* Linha normal */}
                  {editingKey !== key && (
                    <div className="flex items-center gap-3 px-6 py-3">
                      <div
                        className="h-5 w-5 rounded-full shrink-0"
                        style={{ backgroundColor: COLOR_MAP[key] }}
                      />
                      <span className="flex-1 text-[14px] text-[#111b21]">{label}</span>
                      <button
                        onClick={() => { setEditingKey(key); setAddingMarker(false); }}
                        className="h-7 w-7 flex items-center justify-center rounded-full text-[#54656f] hover:text-[#111b21] hover:bg-[#f0f2f5] transition-colors"
                        title="Editar marcador"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => deleteMarker(key)}
                        className="h-7 w-7 flex items-center justify-center rounded-full text-[#54656f] hover:text-red-500 hover:bg-red-50 transition-colors"
                        title="Remover marcador"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}

                  {/* Formulário de edição inline */}
                  {editingKey === key && (
                    <MarkerForm
                      initialColor={key}
                      initialLabel={label}
                      usedColors={usedColors}
                      saving={saving}
                      onSave={(newColor, newLabel) => handleSaveEdit(key, newColor, newLabel)}
                      onCancel={cancelForm}
                    />
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Formulário de novo marcador */}
          {addingMarker && (
            <MarkerForm
              usedColors={usedColors}
              saving={saving}
              onSave={handleSaveNew}
              onCancel={cancelForm}
            />
          )}
        </div>

        {/* Seção B — Conversas Ocultas */}
        <div className="bg-white rounded-xl border border-[#e9edef] overflow-hidden">
          <div className="px-6 py-4 border-b border-[#e9edef]">
            <h2 className="text-[15px] font-medium text-[#111b21]">Conversas Ocultas</h2>
            <p className="text-[13px] text-[#54656f] mt-0.5">
              {hiddenChats.length === 0
                ? "Nenhuma conversa oculta"
                : `${hiddenChats.length} conversa(s) oculta(s)`}
            </p>
          </div>
          {hiddenChats.length === 0 ? (
            <div className="px-6 py-8 text-center text-[13px] text-[#54656f]">
              Nenhuma conversa oculta no momento
            </div>
          ) : (
            <div className="divide-y divide-[#e9edef]">
              {hiddenChats.map((c) => (
                <div key={c.jid} className="flex items-center gap-4 px-6 py-3">
                  <div className="h-10 w-10 rounded-full bg-[#dfe5e7] flex items-center justify-center text-[14px] font-semibold text-[#54656f] shrink-0">
                    {(c.jid || "?").charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] text-[#111b21] truncate">{c.jid}</p>
                  </div>
                  <button
                    onClick={() => unhideChat(c.jid)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] text-[#25d366] border border-[#25d366] hover:bg-[#25d366]/10 transition-colors shrink-0"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    Reexibir
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
