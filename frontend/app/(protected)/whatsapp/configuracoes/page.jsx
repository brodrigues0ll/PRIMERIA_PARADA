"use client";
import { useState, useEffect } from "react";
import { ArrowLeft, Plus, Trash2, Check, Eye, Pencil, X, RotateCcw, Clock } from "lucide-react";
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
    <div data-id="marker-form" className="px-6 py-4 border-t border-[#e9edef] flex flex-col gap-4">
      <div data-id="marker-color-section">
        <p className="text-[12px] font-medium text-[#54656f] mb-2">
          {isEdit ? "Alterar cor" : "Escolha uma cor"}
        </p>
        <div data-id="marker-color-picker" className="flex flex-wrap gap-2">
          {COLOR_KEYS.map((key) => {
            const isUsed = usedColors.has(key) && key !== initialColor;
            const isSelected = color === key;
            return (
              <button
                key={key}
                data-id={`marker-color-option-${key}`}
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

      <div data-id="marker-label-section">
        <p className="text-[12px] font-medium text-[#54656f] mb-1">Nome do marcador</p>
        <input
          data-id="marker-label-input"
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
        <div data-id="marker-preview" className="flex items-center gap-2 px-3 py-2 bg-[#f0f2f5] rounded-lg">
          <div className="h-4 w-4 rounded-full shrink-0" style={{ backgroundColor: COLOR_MAP[color] }} />
          <span className="text-[13px] text-[#111b21]">{label.trim()}</span>
        </div>
      )}

      <div data-id="marker-form-actions" className="flex gap-2">
        <button
          data-id="save-marker-button"
          onClick={() => onSave(color, label)}
          disabled={!color || !label.trim() || saving}
          className="flex-1 py-2 bg-[#25d366] text-white rounded-lg text-[13px] font-medium hover:bg-[#20c55e] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? "Salvando..." : isEdit ? "Salvar alterações" : "Salvar marcador"}
        </button>
        <button
          data-id="cancel-marker-button"
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
  const [chatColorsCount, setChatColorsCount] = useState(0);
  const [resetting, setResetting] = useState(false);
  const [resetHorario, setResetHorario] = useState(""); // "HH:MM" ou ""
  const [resetHorarioSaving, setResetHorarioSaving] = useState(false);

  const [addingMarker, setAddingMarker] = useState(false);
  const [editingKey, setEditingKey] = useState(null); // chave do marcador sendo editado
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/whatsapp/config")
      .then((r) => r.json())
      .then((d) => {
        if (d.colorLabels) setColorLabels(d.colorLabels);
        // Sempre atualiza — null/undefined vira "" (desativado), string vira o horário
        setResetHorario(typeof d.resetHorario === "string" ? d.resetHorario : "");
      })
      .catch(() => {});

    idbGet("hidden_chats").then((list) => {
      if (Array.isArray(list)) setHiddenChats(list.map((jid) => ({ jid })));
    });

    idbGet("chat_colors").then((map) => {
      if (map && typeof map === "object") setChatColorsCount(Object.keys(map).length);
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

  async function handleSaveResetHorario(horario) {
    setResetHorarioSaving(true);
    try {
      const res = await fetch("/api/whatsapp/config", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resetHorario: horario || null }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao salvar");
      // Usa o valor confirmado pelo servidor, não o local
      const confirmed = typeof data.resetHorario === "string" ? data.resetHorario : "";
      setResetHorario(confirmed);
      toast.success(confirmed ? `Reset automático configurado para ${confirmed}` : "Reset automático desativado");
    } catch (e) {
      toast.error(e.message || "Erro ao salvar");
    } finally {
      setResetHorarioSaving(false);
    }
  }

  async function handleResetColors() {
    if (!confirm(`Remover as cores de ${chatColorsCount} conversa(s)? Você poderá remarcar no próximo dia.`)) return;
    setResetting(true);
    try {
      await idbSet("chat_colors", {});
      setChatColorsCount(0);
      toast.success("Cores removidas de todas as conversas");
    } catch {
      toast.error("Erro ao resetar cores");
    } finally {
      setResetting(false);
    }
  }

  async function unhideChat(jid) {
    const next = hiddenChats.filter((c) => c.jid !== jid);
    setHiddenChats(next);
    await idbSet("hidden_chats", next.map((c) => c.jid));
  }

  const formOpen = addingMarker || editingKey !== null;

  return (
    <div data-id="whatsapp-config-page" className="min-h-screen bg-[#f0f2f5]">
      {/* Header */}
      <div data-id="whatsapp-config-header" className="flex items-center gap-4 px-6 h-[60px] bg-white border-b border-[#e9edef] sticky top-0 z-10">
        <Link
          data-id="whatsapp-config-back-button"
          href="/whatsapp"
          className="h-8 w-8 flex items-center justify-center rounded-full text-[#54656f] hover:bg-[#f0f2f5] transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-[17px] font-medium text-[#111b21]">Configurações do WhatsApp</h1>
      </div>

      <div data-id="config-content" className="max-w-2xl mx-auto px-4 py-6 flex flex-col gap-6">

        {/* Seção A — Marcadores de conversa */}
        <div data-id="markers-section" className="bg-white rounded-xl border border-[#e9edef] overflow-hidden">
          <div data-id="markers-section-header" className="flex items-center justify-between px-6 py-4 border-b border-[#e9edef]">
            <div data-id="markers-section-title">
              <h2 className="text-[15px] font-medium text-[#111b21]">Marcadores de Conversa</h2>
              <p className="text-[13px] text-[#54656f] mt-0.5">
                Crie rótulos coloridos para organizar suas conversas
              </p>
            </div>
            {!formOpen && (
              <button
                data-id="add-marker-button"
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
            <div data-id="markers-list" className="divide-y divide-[#e9edef]">
              {configuredMarkers.map(([key, label]) => (
                <div key={key}>
                  {/* Linha normal */}
                  {editingKey !== key && (
                    <div data-id={`marker-item-${key}`} className="flex items-center gap-3 px-6 py-3">
                      <div
                        className="h-5 w-5 rounded-full shrink-0"
                        style={{ backgroundColor: COLOR_MAP[key] }}
                      />
                      <span className="flex-1 text-[14px] text-[#111b21]">{label}</span>
                      <button
                        data-id={`marker-edit-button-${key}`}
                        onClick={() => { setEditingKey(key); setAddingMarker(false); }}
                        className="h-7 w-7 flex items-center justify-center rounded-full text-[#54656f] hover:text-[#111b21] hover:bg-[#f0f2f5] transition-colors"
                        title="Editar marcador"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        data-id={`marker-delete-button-${key}`}
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
        <div data-id="hidden-chats-section" className="bg-white rounded-xl border border-[#e9edef] overflow-hidden">
          <div data-id="hidden-chats-section-header" className="px-6 py-4 border-b border-[#e9edef]">
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
            <div data-id="hidden-chats-list" className="divide-y divide-[#e9edef]">
              {hiddenChats.map((c) => (
                <div key={c.jid} data-id={`hidden-chat-item-${c.jid}`} className="flex items-center gap-4 px-6 py-3">
                  <div data-id={`hidden-chat-avatar-${c.jid}`} className="h-10 w-10 rounded-full bg-[#dfe5e7] flex items-center justify-center text-[14px] font-semibold text-[#54656f] shrink-0">
                    {(c.jid || "?").charAt(0).toUpperCase()}
                  </div>
                  <div data-id={`hidden-chat-info-${c.jid}`} className="flex-1 min-w-0">
                    <p className="text-[14px] text-[#111b21] truncate">{c.jid}</p>
                  </div>
                  <button
                    data-id={`unhide-chat-button-${c.jid}`}
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

        {/* Seção C — Resetar cores das conversas */}
        <div data-id="reset-colors-section" className="bg-white rounded-xl border border-[#e9edef] overflow-hidden">
          <div data-id="reset-colors-section-header" className="px-6 py-4 border-b border-[#e9edef]">
            <h2 className="text-[15px] font-medium text-[#111b21]">Cores das Conversas</h2>
            <p className="text-[13px] text-[#54656f] mt-0.5">
              {chatColorsCount === 0
                ? "Nenhuma conversa marcada com cor no momento"
                : `${chatColorsCount} conversa(s) com cor atribuída`}
            </p>
          </div>
          <div data-id="reset-colors-body" className="px-6 py-5 flex flex-col gap-5">
            <p className="text-[13px] text-[#54656f]">
              Remove as cores de todas as conversas para que você possa remarcar do zero no próximo dia.
              Os marcadores definidos (nomes e cores) não serão afetados.
            </p>

            {/* Reset manual */}
            <button
              data-id="reset-chat-colors-button"
              onClick={handleResetColors}
              disabled={resetting || chatColorsCount === 0}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-red-200 text-red-600 text-[13px] font-medium hover:bg-red-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed w-fit"
            >
              <RotateCcw className="h-4 w-4" />
              {resetting ? "Removendo..." : "Resetar agora"}
            </button>

            {/* Reset automático */}
            <div data-id="auto-reset-section" className="border-t border-[#e9edef] pt-4 flex flex-col gap-3">
              <div data-id="auto-reset-title" className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-[#54656f]" />
                <p className="text-[14px] font-medium text-[#111b21]">Reset automático diário</p>
              </div>
              <p className="text-[13px] text-[#54656f]">
                Configure um horário para o sistema remover automaticamente as cores de todas as conversas todo dia.
                Deixe em branco para desativar.
              </p>
              <div data-id="auto-reset-input-row" className="flex items-center gap-2">
                <input
                  data-id="reset-horario-input"
                  type="time"
                  value={resetHorario}
                  onChange={(e) => setResetHorario(e.target.value)}
                  className="rounded-lg border border-[#e9edef] px-3 py-2 text-[13px] text-[#111b21] focus:outline-none focus:border-[#25d366] bg-white"
                />
                <button
                  data-id="save-reset-horario-button"
                  onClick={() => handleSaveResetHorario(resetHorario)}
                  disabled={resetHorarioSaving}
                  className="px-4 py-2 bg-[#25d366] text-white rounded-lg text-[13px] font-medium hover:bg-[#20c55e] transition-colors disabled:opacity-50"
                >
                  {resetHorarioSaving ? "Salvando..." : "Salvar"}
                </button>
                {resetHorario && (
                  <button
                    data-id="clear-reset-horario-button"
                    onClick={() => handleSaveResetHorario("")}
                    disabled={resetHorarioSaving}
                    className="px-3 py-2 border border-[#e9edef] text-[#54656f] rounded-lg text-[13px] hover:bg-[#f5f6f6] transition-colors"
                    title="Desativar reset automático"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              {resetHorario && (
                <p className="text-[12px] text-[#25d366] flex items-center gap-1">
                  <span>●</span> Ativo — cores serão removidas todo dia às {resetHorario}
                </p>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
