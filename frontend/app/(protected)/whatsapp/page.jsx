"use client";
import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { io } from "socket.io-client";
import {
  ChevronLeft,
  Send,
  MessageCircle,
  LogOut,
  RefreshCw,
  Search,
  MoreVertical,
  Smile,
  Mic,
  Paperclip,
  X,
  Download,
  FileText,
  FileSpreadsheet,
  File,
  Play,
  Pause,
  Settings,
  Plus,
  Palette,
  Check,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import WhatsAppIcon from "@/components/icons/WhatsAppIcon";

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

// ── Color palette ─────────────────────────────────────────────────────────────
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

// Fundo claro da cor (8% opacidade normal, 14% quando selecionado)
const COLOR_MAP_BG = {
  red:    [239, 68,  68],
  orange: [249, 115, 22],
  yellow: [234, 179, 8],
  green:  [34,  197, 94],
  teal:   [20,  184, 166],
  blue:   [59,  130, 246],
  purple: [168, 85,  247],
  pink:   [236, 72,  153],
  gray:   [107, 114, 128],
  brown:  [146, 64,  14],
};

function colorBg(key, selected) {
  const rgb = COLOR_MAP_BG[key];
  if (!rgb) return undefined;
  return `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${selected ? 0.28 : 0.20})`;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatTime(ts) {
  if (!ts) return "";
  const d = new Date(typeof ts === "number" ? ts * 1000 : ts);
  const now = new Date();
  const isToday =
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear();
  if (isToday) {
    return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  }
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

function formatHour(ts) {
  if (!ts) return "";
  const d = new Date(typeof ts === "number" ? ts * 1000 : ts);
  return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

function getInitial(name) {
  return (name || "?").charAt(0).toUpperCase();
}

function truncate(str, max = 40) {
  if (!str) return "";
  return str.length > max ? str.slice(0, max) + "…" : str;
}

// ─── QR / Disconnected screen ────────────────────────────────────────────────

function NotConnectedScreen({ status, qrSrc, onRefresh }) {
  const isQR = status === "qr";
  const isConnecting = status === "connecting";

  return (
    <div className="flex flex-col items-center justify-center h-full px-8 text-center gap-6 bg-[#f0f2f5]">
      <div className="h-16 w-16 rounded-2xl bg-[#25d366]/10 flex items-center justify-center">
        <WhatsAppIcon className="h-8 w-8 text-[#25d366]" />
      </div>

      {isQR && qrSrc ? (
        <>
          <div>
            <p className="text-base font-semibold text-[#111b21] mb-1">Conectar WhatsApp</p>
            <p className="text-sm text-[#54656f]">
              Abra o WhatsApp no celular, vá em{" "}
              <span className="font-medium text-[#111b21]">Dispositivos conectados</span> e
              escaneie o QR code abaixo
            </p>
          </div>
          <img
            src={qrSrc}
            alt="QR Code WhatsApp"
            className="h-56 w-56 rounded-2xl border border-[#e9edef] shadow-sm"
          />
          <p className="text-xs text-[#54656f]">
            O código expira em 60 segundos — será atualizado automaticamente
          </p>
        </>
      ) : isQR && !qrSrc ? (
        <>
          <p className="text-sm text-[#54656f]">Gerando QR code…</p>
          <Skeleton className="h-56 w-56 rounded-2xl" />
        </>
      ) : isConnecting ? (
        <>
          <p className="text-base font-semibold text-[#111b21]">Conectando…</p>
          <p className="text-sm text-[#54656f]">Aguarde enquanto o WhatsApp é inicializado</p>
          <div className="h-8 w-8 rounded-full border-2 border-[#25d366] border-t-transparent animate-spin" />
        </>
      ) : (
        <>
          <div>
            <p className="text-base font-semibold text-[#111b21] mb-1">WhatsApp desconectado</p>
            <p className="text-sm text-[#54656f]">
              O serviço não está respondendo ou a sessão expirou
            </p>
          </div>
          <button
            onClick={onRefresh}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[#e9edef] bg-white text-sm text-[#54656f] hover:bg-[#f0f2f5] transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            Tentar novamente
          </button>
        </>
      )}
    </div>
  );
}

// ─── Status bar (connected) ──────────────────────────────────────────────────

function ConnectedBar({ user, sessions, activeSessionId, onSwitchSession, onConnectNew, onDisconnect, disconnecting, onSettings }) {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!showMenu) return;
    function handler(e) { if (!menuRef.current?.contains(e.target)) setShowMenu(false); }
    window.addEventListener("mousedown", handler);
    return () => window.removeEventListener("mousedown", handler);
  }, [showMenu]);

  return (
    <div className="flex items-center gap-3 px-4 h-[60px] bg-[#f0f2f5] shrink-0">
      {/* Avatar — abre menu de contas ao clicar */}
      <div className="relative shrink-0" ref={menuRef}>
        <button
          onClick={() => setShowMenu((v) => !v)}
          className="h-10 w-10 rounded-full bg-[#dfe5e7] flex items-center justify-center text-sm font-semibold text-[#54656f] overflow-hidden hover:ring-2 hover:ring-[#25d366]/40 transition-all"
          title="Gerenciar contas"
        >
          {user?.name ? getInitial(user.name) : <WhatsAppIcon className="h-5 w-5 text-[#54656f]" />}
        </button>

        {/* Badge com número de contas quando > 1 */}
        {sessions.filter((s) => s.status === "connected").length > 1 && (
          <span className="absolute -bottom-0.5 -right-0.5 h-[18px] min-w-[18px] px-0.5 rounded-full bg-[#25d366] text-white text-[9px] font-bold flex items-center justify-center leading-none pointer-events-none">
            {sessions.filter((s) => s.status === "connected").length}
          </span>
        )}

        {/* Dropdown de sessões */}
        {showMenu && (
          <div className="absolute top-12 left-0 z-50 bg-white rounded-xl shadow-lg border border-[#e9edef] min-w-[240px] py-2 overflow-hidden">
            <p className="px-4 py-1.5 text-[11px] font-semibold text-[#54656f] uppercase tracking-wide">
              Contas WhatsApp
            </p>

            {sessions.length === 0 && (
              <div className="px-4 py-3 text-[13px] text-[#54656f]">Nenhuma conta conectada</div>
            )}

            {sessions.map((session) => (
              <button
                key={session.id}
                onClick={() => { onSwitchSession(session.id); setShowMenu(false); }}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-[#f5f6f6] transition-colors",
                  session.id === activeSessionId && "bg-[#f0f2f5]"
                )}
              >
                <div className="h-9 w-9 rounded-full bg-[#dfe5e7] flex items-center justify-center text-sm font-semibold text-[#54656f] shrink-0 overflow-hidden">
                  {session.user?.name ? getInitial(session.user.name) : <WhatsAppIcon className="h-4 w-4 text-[#54656f]" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-medium text-[#111b21] truncate leading-tight">
                    {session.user?.name || (session.status === "connected" ? "Conectado" : "Conectando...")}
                  </p>
                  {session.user?.id && (
                    <p className="text-[12px] text-[#54656f] truncate">+{session.user.id}</p>
                  )}
                </div>
                {session.id === activeSessionId && (
                  <Check className="h-4 w-4 text-[#25d366] shrink-0" />
                )}
              </button>
            ))}

            <div className="border-t border-[#e9edef] mt-1 pt-1">
              <button
                onClick={() => { onConnectNew(); setShowMenu(false); }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-[#f5f6f6] transition-colors"
              >
                <div className="h-9 w-9 rounded-full bg-[#e9edef] flex items-center justify-center shrink-0">
                  <Plus className="h-4 w-4 text-[#54656f]" />
                </div>
                <span className="text-[14px] text-[#111b21]">Conectar outra conta</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Nome e status */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-[#111b21] leading-none truncate">
          {user?.name || "Conectado"}
        </p>
        <div className="flex items-center gap-1 mt-0.5">
          <span className="h-1.5 w-1.5 rounded-full bg-[#25d366] shrink-0" />
          <p className="text-[11px] text-[#54656f]">Online</p>
        </div>
      </div>

      <button
        onClick={onSettings}
        className="h-8 w-8 flex items-center justify-center rounded-full text-[#54656f] hover:bg-[#e9edef] transition-colors mr-1"
        title="Configurações"
      >
        <Settings className="h-4 w-4" />
      </button>

      <button
        onClick={onDisconnect}
        disabled={disconnecting}
        className="flex items-center gap-1.5 text-xs text-[#54656f] hover:text-red-500 transition-colors disabled:opacity-50"
        title="Desconectar conta ativa"
      >
        <LogOut className="h-4 w-4" />
        {disconnecting ? "Saindo…" : "Sair"}
      </button>
    </div>
  );
}

// ─── Search bar ──────────────────────────────────────────────────────────────

function SearchBar({ value, onChange }) {
  return (
    <div className="px-3 py-2 bg-[#f0f2f5] shrink-0">
      <div className="flex items-center gap-2 bg-white rounded-full px-3 h-9">
        <Search className="h-4 w-4 text-[#54656f] shrink-0" />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Pesquisar ou começar uma conversa"
          className="flex-1 text-[13px] text-[#111b21] placeholder:text-[#54656f] bg-transparent focus:outline-none"
        />
        {value && (
          <button onClick={() => onChange("")} className="text-[#54656f] hover:text-[#111b21]">
            ✕
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Chat List ───────────────────────────────────────────────────────────────

function ChatListSkeleton() {
  return (
    <div className="flex flex-col">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-4 py-3 border-b border-[#e9edef]">
          <Skeleton className="h-12 w-12 rounded-full shrink-0" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-3.5 w-32" />
            <Skeleton className="h-3 w-48" />
          </div>
          <Skeleton className="h-3 w-10 shrink-0" />
        </div>
      ))}
    </div>
  );
}

// ── Cache de fotos ───────────────────────────────────────────────────────────
// picCache: jid → blob URL | null  (null = sem foto, confirmado pelo servidor)
// picPending: jid → Promise  (evita fetches duplicados quando vários ChatAvatar montam juntos)
const picCache   = new Map()
const picPending = new Map()

// Lê do sessionStorage os JIDs conhecidos sem foto para não rebuscar no F5
try {
  const stored = JSON.parse(sessionStorage.getItem("wa-no-pic") || "[]")
  for (const jid of stored) picCache.set(jid, null)
} catch {}

function markNoPic(jid) {
  picCache.set(jid, null)
  try {
    const stored = JSON.parse(sessionStorage.getItem("wa-no-pic") || "[]")
    if (!stored.includes(jid)) {
      stored.push(jid)
      sessionStorage.setItem("wa-no-pic", JSON.stringify(stored))
    }
  } catch {}
}

async function fetchPicture(jid) {
  if (picCache.has(jid)) return picCache.get(jid)
  if (picPending.has(jid)) return picPending.get(jid)

  const promise = fetch(`/api/whatsapp/chats/${encodeURIComponent(jid)}/picture`)
    .then((r) => {
      if (!r.ok) { markNoPic(jid); return null }
      return r.blob().then((blob) => {
        const url = URL.createObjectURL(blob)
        picCache.set(jid, url)
        return url
      })
    })
    .catch(() => { markNoPic(jid); return null })
    .finally(() => picPending.delete(jid))

  picPending.set(jid, promise)
  return promise
}

function ChatAvatar({ jid, name, size = "md" }) {
  const [picSrc, setPicSrc] = useState(() => picCache.has(jid) ? picCache.get(jid) : undefined);

  useEffect(() => {
    if (picCache.has(jid)) { setPicSrc(picCache.get(jid)); return; }
    let cancelled = false;
    fetchPicture(jid).then((url) => { if (!cancelled) setPicSrc(url ?? null); });
    return () => { cancelled = true; };
  }, [jid]);

  const dim = size === "lg" ? "h-12 w-12 text-base" : "h-10 w-10 text-sm";

  return (
    <div
      className={cn(
        "rounded-full bg-[#dfe5e7] text-[#54656f] flex items-center justify-center shrink-0 font-semibold overflow-hidden",
        dim
      )}
    >
      {picSrc ? (
        <img src={picSrc} alt="" className="h-full w-full object-cover" />
      ) : (
        getInitial(name)
      )}
    </div>
  );
}

const LAST_MSG_LABELS = {
  audioMessage: "🎙 Áudio",
  pttMessage: "🎙 Áudio",
  imageMessage: "📷 Foto",
  videoMessage: "📹 Vídeo",
  documentMessage: "📄 Documento",
  documentWithCaptionMessage: "📄 Documento",
  stickerMessage: "🔖 Figurinha",
};

function ChatItem({ chat, selected, onClick, color, nickname, colorLabels, onMarkRead, onSetNickname, onHide, onSetColor }) {
  const displayName = nickname || chat.name || chat.jid;
  const preview = chat.lastMessage?.text
    ? truncate(chat.lastMessage.text)
    : chat.lastMessage?.type
    ? (LAST_MSG_LABELS[chat.lastMessage.type] ?? "Mensagem")
    : "Sem mensagens";
  const time = formatTime(chat.lastMessage?.timestamp || chat.timestamp);

  const [ctxMenu, setCtxMenu] = useState(null); // { x, y }
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(displayName);
  const itemRef = useRef(null);

  function handleContextMenu(e) {
    e.preventDefault();
    setCtxMenu({ x: e.clientX, y: e.clientY });
  }

  // fecha menu ao clicar fora
  useEffect(() => {
    if (!ctxMenu) return;
    function handler() {
      setCtxMenu(null);
    }
    window.addEventListener("click", handler);
    return () => window.removeEventListener("click", handler);
  }, [ctxMenu]);

  // fecha color picker ao clicar fora
  useEffect(() => {
    if (!showColorPicker) return;
    function handler() {
      setShowColorPicker(false);
    }
    window.addEventListener("click", handler);
    return () => window.removeEventListener("click", handler);
  }, [showColorPicker]);

  async function confirmName() {
    if (nameInput.trim() && nameInput.trim() !== displayName) {
      await onSetNickname?.(chat.jid, nameInput.trim());
    }
    setEditingName(false);
  }

  return (
    <div ref={itemRef} className="relative group" onContextMenu={handleContextMenu}>
      {/* Barra de cor esquerda */}
      {color && COLOR_MAP[color] && (
        <div
          className="absolute left-0 top-0 bottom-0 w-[3px] rounded-r z-10"
          style={{ backgroundColor: COLOR_MAP[color] }}
        />
      )}

      <button
        onClick={onClick}
        style={color ? { backgroundColor: colorBg(color, selected) } : undefined}
        className={cn(
          "w-full flex items-center gap-3 py-3 text-left transition-colors border-b border-[#e9edef]",
          color ? "pl-[18px] pr-4" : "px-4",
          !color && (selected ? "bg-[#f0f2f5]" : "bg-white hover:bg-[#f5f6f6]")
        )}
      >
        <ChatAvatar jid={chat.jid} name={displayName} size="lg" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-0.5">
            {editingName ? (
              <input
                autoFocus
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                onBlur={confirmName}
                onKeyDown={(e) => { if (e.key === "Enter") confirmName(); if (e.key === "Escape") setEditingName(false); }}
                onClick={(e) => e.stopPropagation()}
                className="flex-1 text-[15px] font-normal text-[#111b21] bg-transparent border-b border-[#25d366] focus:outline-none"
              />
            ) : (
              <span className="text-[15px] font-normal text-[#111b21] truncate">{displayName}</span>
            )}
            <span className={cn("text-[12px] shrink-0", chat.unreadCount > 0 ? "text-[#25d366]" : "text-[#54656f]")}>
              {time}
            </span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-[13px] text-[#54656f] truncate">{preview}</span>
            {chat.unreadCount > 0 && (
              <span className="h-5 min-w-5 px-1 rounded-full bg-[#25d366] text-white text-[11px] font-medium flex items-center justify-center shrink-0">
                {chat.unreadCount}
              </span>
            )}
          </div>
        </div>

      </button>

      {/* Botão paleta — sobreposição, aparece no hover */}
      <button
        onClick={(e) => { e.stopPropagation(); setShowColorPicker(true); setCtxMenu(null); }}
        className="absolute right-3 top-1/2 -translate-y-1/2 h-7 w-7 flex items-center justify-center rounded-full text-[#54656f] hover:bg-[#e9edef] opacity-0 group-hover:opacity-100 transition-opacity z-10"
        title="Marcar cor"
      >
        <Palette className="h-4 w-4" />
      </button>

      {/* Menu de contexto */}
      {ctxMenu && (
        <div
          className="fixed z-50 bg-white rounded-lg shadow-lg border border-[#e9edef] py-1 min-w-[180px]"
          style={{ top: ctxMenu.y, left: ctxMenu.x }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => { onMarkRead?.(); setCtxMenu(null); }}
            className="w-full text-left px-4 py-2 text-[14px] text-[#111b21] hover:bg-[#f5f6f6]"
          >
            Marcar como lida
          </button>
          <button
            onClick={() => { setEditingName(true); setNameInput(displayName); setCtxMenu(null); }}
            className="w-full text-left px-4 py-2 text-[14px] text-[#111b21] hover:bg-[#f5f6f6]"
          >
            Definir nome
          </button>
          <button
            onClick={() => { onHide?.(); setCtxMenu(null); }}
            className="w-full text-left px-4 py-2 text-[14px] text-red-500 hover:bg-[#f5f6f6]"
          >
            Ocultar conversa
          </button>
        </div>
      )}

      {/* Seletor de cores */}
      {showColorPicker && (
        <div
          className="fixed z-50 bg-white rounded-lg shadow-lg border border-[#e9edef] p-3 min-w-[160px]"
          style={{
            top: itemRef.current?.getBoundingClientRect().top ?? 0,
            left: (itemRef.current?.getBoundingClientRect().right ?? 0) + 4,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-2">
            <p className="text-[11px] text-[#54656f] font-medium">Marcadores</p>
            <button
              onClick={() => setShowColorPicker(false)}
              className="h-5 w-5 flex items-center justify-center rounded-full hover:bg-[#f0f2f5] text-[#54656f]"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
          {Object.keys(colorLabels || {}).length === 0 ? (
            <p className="text-[12px] text-[#54656f] text-center py-2 leading-snug">
              Nenhum marcador configurado
            </p>
          ) : (
            <div className="flex flex-col gap-0.5">
              {Object.entries(colorLabels || {}).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => { onSetColor?.(chat.jid, color === key ? null : key); setShowColorPicker(false); }}
                  className={cn(
                    "flex items-center gap-2.5 px-2 py-1.5 rounded-md text-left transition-colors",
                    color === key ? "bg-[#f0f2f5]" : "hover:bg-[#f5f6f6]"
                  )}
                >
                  <div
                    className="h-4 w-4 rounded-full shrink-0 flex items-center justify-center"
                    style={{ backgroundColor: COLOR_MAP[key] }}
                  >
                    {color === key && <Check className="h-2.5 w-2.5 text-white" />}
                  </div>
                  <span className="text-[13px] text-[#111b21] truncate">{label}</span>
                </button>
              ))}
            </div>
          )}
          {color && (
            <button
              onClick={() => { onSetColor?.(chat.jid, null); setShowColorPicker(false); }}
              className="mt-2 pt-2 border-t border-[#e9edef] w-full text-[11px] text-[#54656f] hover:text-[#111b21] text-center"
            >
              Remover marcador
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Quoted Preview ──────────────────────────────────────────────────────────

function QuotedPreview({ quoted, compact = false }) {
  if (!quoted) return null;
  return (
    <div className={cn(
      "border-l-[3px] border-[#25d366] bg-black/5 rounded-[4px] px-2 py-1 mb-1",
      compact ? "text-[11px]" : "text-[12px]"
    )}>
      <p className="text-[#25d366] font-medium text-[11px] leading-tight mb-0.5">Mensagem citada</p>
      <p className="text-[#54656f] truncate leading-snug">{quoted.text || "[mídia]"}</p>
    </div>
  );
}

// ─── Message Bubble ──────────────────────────────────────────────────────────

const MEDIA_TYPES = new Set(["imageMessage", "stickerMessage", "videoMessage"])
const DOC_TYPES   = new Set(["documentMessage", "documentWithCaptionMessage"])
const AUDIO_TYPES = new Set(["audioMessage", "pttMessage"])

const URL_RE = /https?:\/\/[^\s<>"{}|\\^`[\]]+/g;

function extractFirstUrl(text) {
  const m = text?.match(URL_RE);
  return m ? m[0] : null;
}

function TextWithLinks({ text }) {
  const parts = [];
  let last = 0;
  let m;
  URL_RE.lastIndex = 0;
  while ((m = URL_RE.exec(text)) !== null) {
    if (m.index > last) parts.push({ type: "text", value: text.slice(last, m.index) });
    parts.push({ type: "url", value: m[0] });
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push({ type: "text", value: text.slice(last) });
  return (
    <>
      {parts.map((p, i) =>
        p.type === "url" ? (
          <a key={i} href={p.value} target="_blank" rel="noreferrer"
            className="underline break-all"
            onClick={(e) => e.stopPropagation()}
          >
            {p.value}
          </a>
        ) : (
          <span key={i}>{p.value}</span>
        )
      )}
    </>
  );
}

const previewCache = new Map();

function LinkPreview({ url, isMine }) {
  const [data, setData] = useState(undefined);

  useEffect(() => {
    if (previewCache.has(url)) { setData(previewCache.get(url)); return; }
    fetch(`/api/link-preview?url=${encodeURIComponent(url)}`)
      .then((r) => r.json())
      .then((d) => {
        const val = d.title || d.image ? d : null;
        previewCache.set(url, val);
        setData(val);
      })
      .catch(() => { previewCache.set(url, null); setData(null); });
  }, [url]);

  if (!data) return null;

  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="block no-underline overflow-hidden"
      onClick={(e) => e.stopPropagation()}
    >
      {data.image && (
        <img
          src={data.image}
          alt=""
          className="w-full max-h-52 object-cover"
          onError={(e) => { e.currentTarget.style.display = "none"; }}
        />
      )}
      <div className={cn(
        "px-3 py-2 border-l-4",
        isMine ? "border-[#25d366] bg-[#c5e8bb]" : "border-[#25d366] bg-[#f0f2f5]"
      )}>
        {data.siteName && (
          <p className="text-[11px] text-[#667781] font-medium uppercase tracking-wide mb-0.5">
            {data.siteName}
          </p>
        )}
        {data.title && (
          <p className="text-[13px] font-semibold text-[#111b21] leading-snug line-clamp-2">
            {data.title}
          </p>
        )}
        {data.description && (
          <p className="text-[12px] text-[#54656f] leading-snug line-clamp-2 mt-0.5">
            {data.description}
          </p>
        )}
      </div>
    </a>
  );
}

function fileIcon(filename) {
  const ext = (filename || "").split(".").pop().toLowerCase()
  if (ext === "pdf") return <FileText className="h-8 w-8 text-red-500 shrink-0" />
  if (["xls", "xlsx", "csv"].includes(ext)) return <FileSpreadsheet className="h-8 w-8 text-green-600 shrink-0" />
  if (["doc", "docx"].includes(ext)) return <FileText className="h-8 w-8 text-blue-500 shrink-0" />
  return <File className="h-8 w-8 text-[#54656f] shrink-0" />
}

function DocumentContent({ msg }) {
  const [downloading, setDownloading] = useState(false)
  const filename = msg.text || "documento"
  const encodedJid = encodeURIComponent(msg.jid)
  const mediaUrl = `/api/whatsapp/chats/${encodedJid}/messages/${msg.id}/media`

  async function handleDownload() {
    setDownloading(true)
    try {
      const res = await fetch(mediaUrl)
      if (!res.ok) throw new Error("Falha ao baixar")
      const blob = await res.blob()
      const a = document.createElement("a")
      a.href = URL.createObjectURL(blob)
      a.download = filename
      a.click()
      URL.revokeObjectURL(a.href)
    } catch {
      toast.error("Erro ao baixar arquivo")
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="flex items-center gap-3 px-3 py-2.5 min-w-[220px] max-w-[280px]">
      {fileIcon(filename)}
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-medium text-[#111b21] truncate leading-tight">{filename}</p>
        <p className="text-[11px] text-[#54656f] mt-0.5">Documento</p>
      </div>
      <button
        onClick={handleDownload}
        disabled={downloading}
        className="h-8 w-8 flex items-center justify-center rounded-full text-[#54656f] hover:bg-black/10 transition-colors shrink-0 disabled:opacity-50"
        title="Baixar arquivo"
      >
        {downloading
          ? <div className="h-4 w-4 border-2 border-[#54656f] border-t-transparent rounded-full animate-spin" />
          : <Download className="h-4 w-4" />}
      </button>
    </div>
  )
}

function formatAudioTime(secs) {
  const s = Math.floor(secs || 0);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

function AudioContent({ msg, isMine }) {
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [speed, setSpeed] = useState(1);
  const audioRef = useRef(null);
  const canvasRef = useRef(null);

  const src = `/api/whatsapp/chats/${encodeURIComponent(msg.jid)}/messages/${msg.id}/media`;

  // Gera forma de onda determinística baseada no ID da mensagem
  const bars = useMemo(() => {
    const seed = [...msg.id].reduce((a, c) => a + c.charCodeAt(0), 0);
    return Array.from({ length: 44 }, (_, i) => {
      const v = Math.abs(Math.sin(seed * 0.31 + i * 0.7) * Math.cos(i * 0.4 + seed * 0.07));
      return 0.12 + v * 0.88;
    });
  }, [msg.id]);

  // Redesenha o canvas ao mudar progresso ou tamanho
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const W = canvas.offsetWidth * window.devicePixelRatio;
    const H = canvas.offsetHeight * window.devicePixelRatio;
    canvas.width = W;
    canvas.height = H;

    const barW = Math.round(3 * window.devicePixelRatio);
    const gap = Math.round(2 * window.devicePixelRatio);
    const totalW = bars.length * (barW + gap) - gap;
    const startX = (W - totalW) / 2;
    const progress = duration > 0 ? currentTime / duration : 0;

    ctx.clearRect(0, 0, W, H);
    bars.forEach((h, i) => {
      const barH = Math.max(barW, h * (H - 4 * window.devicePixelRatio));
      const x = startX + i * (barW + gap);
      const y = (H - barH) / 2;
      const filled = i / bars.length <= progress;
      ctx.fillStyle = filled
        ? (isMine ? "#25d366" : "#53bdeb")
        : (isMine ? "#a8d5b3" : "#c4cdd2");
      ctx.beginPath();
      ctx.roundRect(x, y, barW, barH, barW / 2);
      ctx.fill();
    });
  }, [bars, currentTime, duration, isMine]);

  function togglePlay() {
    const a = audioRef.current;
    if (!a) return;
    playing ? a.pause() : a.play();
  }

  function cycleSpeed() {
    const opts = [1, 1.5, 2];
    const next = opts[(opts.indexOf(speed) + 1) % opts.length];
    setSpeed(next);
    if (audioRef.current) audioRef.current.playbackRate = next;
  }

  function seek(e) {
    const a = audioRef.current;
    if (!a || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    a.currentTime = ((e.clientX - rect.left) / rect.width) * duration;
  }

  return (
    <div className="flex items-center gap-2.5 px-3 py-2.5 min-w-[260px] max-w-[320px]">
      {/* Botão play/pause */}
      <button
        onClick={togglePlay}
        className={cn(
          "h-10 w-10 rounded-full flex items-center justify-center shrink-0 transition-colors",
          isMine ? "bg-[#25d366] text-white" : "bg-[#25d366] text-white"
        )}
      >
        {playing
          ? <Pause className="h-4 w-4" />
          : <Play className="h-4 w-4 ml-0.5" />}
      </button>

      {/* Waveform + meta */}
      <div className="flex-1 flex flex-col gap-1 min-w-0">
        <canvas
          ref={canvasRef}
          onClick={seek}
          className="w-full cursor-pointer"
          style={{ height: 24, display: "block" }}
        />
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-[#54656f]">
            {formatAudioTime(playing || currentTime > 0 ? currentTime : duration)}
          </span>
          <button
            onClick={cycleSpeed}
            className="text-[11px] font-semibold text-[#54656f] hover:text-[#111b21] transition-colors"
          >
            {speed === 1 ? "1×" : speed === 1.5 ? "1,5×" : "2×"}
          </button>
        </div>
      </div>

      {/* Ícone do tipo */}
      <div className={cn(
        "h-10 w-10 rounded-full flex items-center justify-center shrink-0",
        isMine ? "bg-[#b7e5c1]" : "bg-[#dfe5e7]"
      )}>
        <Mic className="h-4 w-4 text-[#54656f]" />
      </div>

      <audio
        ref={audioRef}
        src={src}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => { setPlaying(false); setCurrentTime(0); }}
        onTimeUpdate={() => setCurrentTime(audioRef.current?.currentTime || 0)}
        onLoadedMetadata={() => setDuration(audioRef.current?.duration || 0)}
        preload="metadata"
      />
    </div>
  );
}

function VideoContent({ msg }) {
  const [active, setActive] = useState(false);
  const src = `/api/whatsapp/chats/${encodeURIComponent(msg.jid)}/messages/${msg.id}/media`;

  if (!active) {
    return (
      <div
        className="relative max-w-full w-64 h-40 bg-black/80 rounded-[6px] flex items-center justify-center cursor-pointer group"
        onClick={() => setActive(true)}
      >
        <div className="h-14 w-14 rounded-full bg-black/50 flex items-center justify-center group-hover:bg-black/70 transition-colors">
          <Play className="h-7 w-7 text-white ml-1" />
        </div>
        <span className="absolute bottom-2 right-2 text-[11px] text-white/80">Vídeo</span>
      </div>
    );
  }

  return (
    <div className="relative max-w-full">
      <video
        src={src}
        controls
        autoPlay
        preload="none"
        className="max-w-full rounded-[6px] max-h-64"
      />
      <a
        href={src}
        download
        className="absolute top-2 right-2 h-7 w-7 rounded-full bg-black/50 flex items-center justify-center hover:bg-black/70 transition-colors"
        title="Salvar vídeo"
        onClick={(e) => e.stopPropagation()}
      >
        <Download className="h-3.5 w-3.5 text-white" />
      </a>
    </div>
  );
}

function MediaContent({ msg }) {
  const encodedJid = encodeURIComponent(msg.jid)
  const src = `/api/whatsapp/chats/${encodedJid}/messages/${msg.id}/media`
  const isSticker = msg.type === "stickerMessage"
  const isVideo = msg.type === "videoMessage"

  if (isSticker) {
    return (
      <img
        src={src}
        alt="sticker"
        className="w-32 h-32 object-contain"
        loading="lazy"
      />
    )
  }

  if (isVideo) {
    return <VideoContent msg={msg} />;
  }

  return (
    <img
      src={src}
      alt={msg.text || "imagem"}
      className="max-w-full rounded-[6px] max-h-64 object-cover cursor-pointer"
      loading="lazy"
    />
  )
}

function MessageBubble({ msg, onReply }) {
  const isMine  = msg.fromMe;
  const isMedia  = MEDIA_TYPES.has(msg.type)
  const isSticker = msg.type === "stickerMessage"
  const isDoc    = DOC_TYPES.has(msg.type)
  const isAudio  = AUDIO_TYPES.has(msg.type)

  const replyBtn = (
    <button
      onClick={() => onReply?.(msg)}
      className="absolute -top-2 right-2 hidden group-hover:flex h-6 w-6 items-center justify-center rounded-full bg-[#e9edef] text-[#54656f] shadow-sm z-10"
    >
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 17 4 12 9 7"/><path d="M20 18v-2a4 4 0 0 0-4-4H4"/></svg>
    </button>
  )

  const timeRow = (extra = "") => (
    <div className={cn("flex items-center gap-1 justify-end", extra)}>
      <span className="text-[11px] text-[#667781] whitespace-nowrap">{formatHour(msg.timestamp)}</span>
      {isMine && <span className="text-[#53bdeb] text-[13px] leading-none">✓✓</span>}
    </div>
  )

  if (isSticker) {
    return (
      <div className={cn("flex group", isMine ? "justify-end" : "justify-start")}>
        <div className="max-w-[65%] relative">
          <MediaContent msg={msg} />
          {timeRow("mt-0.5")}
          <button
            onClick={() => onReply?.(msg)}
            className="absolute top-1 right-1 hidden group-hover:flex h-6 w-6 items-center justify-center rounded-full bg-black/20 text-white"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 17 4 12 9 7"/><path d="M20 18v-2a4 4 0 0 0-4-4H4"/></svg>
          </button>
        </div>
      </div>
    )
  }

  const bubbleBase = cn(
    "relative max-w-[65%] text-[14px] leading-[19px]",
    isMine
      ? "bg-[#d9fdd3] rounded-[7.5px] rounded-tr-none"
      : "bg-white rounded-[7.5px] rounded-tl-none shadow-[0_1px_2px_rgba(0,0,0,0.13)]",
  )

  // ── Documento ──────────────────────────────────────────────────────────────
  if (isDoc) {
    return (
      <div className={cn("flex group", isMine ? "justify-end" : "justify-start")}>
        <div className={cn(bubbleBase, "overflow-hidden")}>
          {msg.quotedMessage && <div className="px-3 pt-2 pb-0"><QuotedPreview quoted={msg.quotedMessage} /></div>}
          <DocumentContent msg={msg} />
          {timeRow("px-3 pb-2 mt-[-2px]")}
          {replyBtn}
        </div>
      </div>
    )
  }

  // ── Áudio ──────────────────────────────────────────────────────────────────
  if (isAudio) {
    return (
      <div className={cn("flex group", isMine ? "justify-end" : "justify-start")}>
        <div className={cn(bubbleBase, "overflow-hidden")}>
          {msg.quotedMessage && <div className="px-2 pt-2 pb-0"><QuotedPreview quoted={msg.quotedMessage} /></div>}
          <AudioContent msg={msg} isMine={isMine} />
          {timeRow("px-3 pb-2 mt-[-4px]")}
          {replyBtn}
        </div>
      </div>
    )
  }

  return (
    <div className={cn("flex group", isMine ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          bubbleBase,
          isMedia ? "p-[3px]" : "px-[9px] pt-[6px] pb-[8px]"
        )}
      >
        {msg.quotedMessage && (
          <div className="px-0 pt-0 pb-1">
            <QuotedPreview quoted={msg.quotedMessage} />
          </div>
        )}
        {isMedia && <MediaContent msg={msg} />}
        {msg.text && !isMedia && (() => {
          const firstUrl = extractFirstUrl(msg.text);
          return (
            <>
              {firstUrl && (
                <div className="overflow-hidden rounded-[4px] mb-1 -mx-[9px] -mt-[6px]">
                  <LinkPreview url={firstUrl} isMine={isMine} />
                </div>
              )}
              <p className="break-words whitespace-pre-wrap text-[#111b21] pr-10">
                <TextWithLinks text={msg.text} />
              </p>
            </>
          );
        })()}
        {msg.text && isMedia && (
          <p className="break-words whitespace-pre-wrap text-[#111b21] px-[6px] pb-[2px] pt-[4px] pr-10">
            <TextWithLinks text={msg.text} />
          </p>
        )}
        {timeRow(isMedia ? "px-[6px] pb-[4px] mt-[-4px]" : "mt-[-4px]")}
        {replyBtn}
      </div>
    </div>
  );
}

// ─── Messages Panel ──────────────────────────────────────────────────────────

function MessagesSkeleton() {
  return (
    <div className="flex flex-col gap-3 px-4 py-4">
      {[...Array(5)].map((_, i) => (
        <div key={i} className={cn("flex", i % 2 === 0 ? "justify-start" : "justify-end")}>
          <Skeleton
            className={cn(
              "h-12 rounded-[7.5px]",
              i % 2 === 0 ? "w-48 rounded-tl-none" : "w-36 rounded-tr-none"
            )}
          />
        </div>
      ))}
    </div>
  );
}

function MessagesPanel({ chat, sessionId, onBack, liveMessage, onSent, onOpenDelivery, hasDraft }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [replyTo, setReplyTo] = useState(null);
  const scrollAreaRef = useRef(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);
  const encodedJid = encodeURIComponent(chat.jid);
  const sidParam = sessionId ? `?sid=${sessionId}` : "";
  const sidAnd = sessionId ? `&sid=${sessionId}` : "";

  const fetchMessages = useCallback(async () => {
    try {
      const res = await fetch(`/api/whatsapp/chats/${encodedJid}/messages?limit=100${sidAnd}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      const raw = Array.isArray(data) ? data : [];
      const seen = new Set();
      const list = raw.filter((m) => { if (seen.has(m.id)) return false; seen.add(m.id); return true; });
      setMessages((prev) => {
        const serverIds = new Set(list.map((m) => m.id));
        const pending = prev.filter((m) => m.id.startsWith("temp-") && !serverIds.has(m.id));
        return pending.length ? [...list, ...pending] : list;
      });
    } catch {
      toast.error("Erro ao carregar mensagens");
    } finally {
      setLoading(false);
    }
  }, [encodedJid, sidAnd]);

  useEffect(() => {
    fetch(`/api/whatsapp/chats/${encodedJid}/read${sidParam}`, { method: "POST" }).catch(() => {});
  }, [encodedJid, sidParam]);

  useEffect(() => {
    setMessages([]);
    setLoading(true);
    fetchMessages();
  }, [fetchMessages, chat.jid]);

  useEffect(() => {
    if (!loading && scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages, loading]);

  useEffect(() => {
    if (!liveMessage) return;
    if (liveMessage.jid !== chat.jid) return;
    setMessages((prev) => {
      if (prev.some((m) => m.id === liveMessage.id)) return prev;
      return [...prev, liveMessage];
    });
  }, [liveMessage, chat.jid]);

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend(e);
    }
  }

  async function handleSend(e) {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    setSending(true);
    setText("");

    const tempId = `temp-${Date.now()}`;
    const optimistic = {
      id: tempId,
      jid: chat.jid,
      fromMe: true,
      timestamp: Math.floor(Date.now() / 1000),
      text: trimmed,
      type: "conversation",
      status: null,
      quotedMessage: replyTo ? { id: replyTo.id, text: replyTo.text } : null,
    };
    setMessages((prev) => [...prev, optimistic]);
    onSent?.(optimistic);
    setReplyTo(null);

    try {
      const res = await fetch(`/api/whatsapp/chats/${encodedJid}/messages${sidParam}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: trimmed, quotedMessageId: replyTo?.id || null }),
      });
      if (!res.ok) {
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
        setText(trimmed);
        throw new Error();
      }
      const data = await res.json();
      // Troca o id temporário pelo id real; remove duplicata que possa ter chegado pelo WebSocket
      if (data?.id) {
        setMessages((prev) => {
          const withoutDup = prev.filter((m) => m.id !== data.id);
          return withoutDup.map((m) => (m.id === tempId ? { ...m, id: data.id } : m));
        });
      }
      // Reconcilia com o servidor para garantir ordem e campos corretos
      setTimeout(fetchMessages, 1500);
    } catch {
      toast.error("Erro ao enviar mensagem");
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  }

  async function handleSendMedia(file) {
    const MAX_MB = 16;
    if (file.size > MAX_MB * 1024 * 1024) {
      toast.error(`Arquivo muito grande (máximo ${MAX_MB}MB)`);
      return;
    }
    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = e.target.result.split(",")[1];
      const mimetype = file.type || "application/octet-stream";
      let type = "document";
      if (mimetype.startsWith("image/")) type = "image";
      else if (mimetype.startsWith("video/")) type = "video";
      else if (mimetype.startsWith("audio/")) type = "audio";

      const tempId = `temp-${Date.now()}`;
      const optimistic = {
        id: tempId,
        jid: chat.jid,
        fromMe: true,
        timestamp: Math.floor(Date.now() / 1000),
        text: file.name,
        type: type === "image" ? "imageMessage" : type === "video" ? "videoMessage" : type === "audio" ? "audioMessage" : "documentMessage",
        status: null,
        quotedMessage: replyTo ? { id: replyTo.id, text: replyTo.text } : null,
      };
      setMessages((prev) => [...prev, optimistic]);
      onSent?.(optimistic);
      setReplyTo(null);

      try {
        const res = await fetch(`/api/whatsapp/chats/${encodedJid}/messages/media${sidParam}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type,
            base64,
            mimetype,
            filename: file.name,
            quotedMessageId: replyTo?.id || null,
          }),
        });
        if (!res.ok) {
          setMessages((prev) => prev.filter((m) => m.id !== tempId));
          throw new Error();
        }
        const data = await res.json();
        if (data?.id) {
          setMessages((prev) => {
            const withoutDup = prev.filter((m) => m.id !== data.id);
            return withoutDup.map((m) => (m.id === tempId ? { ...m, id: data.id } : m));
          });
        }
        setTimeout(fetchMessages, 1500);
      } catch {
        toast.error("Erro ao enviar arquivo");
      }
    };
    reader.readAsDataURL(file);
  }

  const isEmpty = !text.trim();

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 h-[60px] bg-[#f0f2f5] shrink-0 shadow-sm">
        <button
          className="h-8 w-8 flex items-center justify-center text-[#54656f] hover:text-[#111b21] md:hidden"
          onClick={onBack}
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <ChatAvatar jid={chat.jid} name={chat.name} size="md" />
        <div className="flex-1 min-w-0 flex items-center gap-1.5">
          <p className="text-[15px] font-medium text-[#111b21] truncate leading-tight">
            {chat.name || chat.jid}
          </p>
          <button
            onClick={() => onOpenDelivery?.()}
            className="relative h-6 w-6 flex items-center justify-center rounded-full text-[#54656f] hover:bg-[#e9edef] transition-colors shrink-0"
            title="Abrir pedido de delivery"
          >
            <Plus className="h-4 w-4" />
            {hasDraft && (
              <span className="absolute top-0 right-0 h-1.5 w-1.5 rounded-full bg-orange-500" />
            )}
          </button>
        </div>
        <div className="flex items-center gap-1">
          <button className="h-9 w-9 flex items-center justify-center rounded-full text-[#54656f] hover:bg-[#e9edef] transition-colors">
            <Search className="h-5 w-5" />
          </button>
          <button className="h-9 w-9 flex items-center justify-center rounded-full text-[#54656f] hover:bg-[#e9edef] transition-colors">
            <MoreVertical className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Messages area */}
      <div
        ref={scrollAreaRef}
        className="flex-1 overflow-y-auto px-[5%] py-4"
        style={{ backgroundColor: "#efeae2" }}
      >
        {loading ? (
          <MessagesSkeleton />
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-16 text-center">
            <div className="h-12 w-12 rounded-full bg-white/60 flex items-center justify-center mb-3 shadow-sm">
              <MessageCircle className="h-5 w-5 text-[#54656f]" />
            </div>
            <p className="text-sm text-[#54656f]">Nenhuma mensagem ainda</p>
          </div>
        ) : (
          <div className="flex flex-col gap-[2px]">
            {messages.map((msg) => (
              <MessageBubble key={msg.id} msg={msg} onReply={setReplyTo} />
            ))}
          </div>
        )}
      </div>

      {/* Reply preview bar */}
      {replyTo && (
        <div className="flex items-center gap-2 px-4 py-2 bg-[#f0f2f5] border-t border-[#e9edef]">
          <div className="flex-1 border-l-[3px] border-[#25d366] bg-white rounded-[6px] px-3 py-1.5">
            <p className="text-[11px] text-[#25d366] font-medium mb-0.5">Responder</p>
            <p className="text-[12px] text-[#54656f] truncate">{replyTo.text || "[mídia]"}</p>
          </div>
          <button
            type="button"
            onClick={() => setReplyTo(null)}
            className="h-7 w-7 flex items-center justify-center rounded-full text-[#54656f] hover:bg-[#e9edef]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Input area */}
      <form
        onSubmit={handleSend}
        className="flex items-end gap-2 px-3 py-3 bg-[#f0f2f5] shrink-0"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const file = e.dataTransfer.files[0];
          if (file) handleSendMedia(file);
        }}
      >
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleSendMedia(file);
            e.target.value = "";
          }}
        />

        {/* Emoji icon */}
        <button
          type="button"
          className="h-9 w-9 flex items-center justify-center text-[#54656f] hover:text-[#111b21] shrink-0 transition-colors mb-[1px]"
        >
          <Smile className="h-[22px] w-[22px]" />
        </button>

        {/* Paperclip / attach */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="h-9 w-9 flex items-center justify-center text-[#54656f] hover:text-[#111b21] shrink-0 transition-colors mb-[1px]"
        >
          <Paperclip className="h-[20px] w-[20px]" />
        </button>

        {/* Text input */}
        <textarea
          ref={inputRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Digite uma mensagem"
          rows={1}
          className="flex-1 min-h-[42px] max-h-[120px] rounded-3xl bg-white px-4 py-[10px] text-[15px] text-[#111b21] placeholder:text-[#54656f] focus:outline-none resize-none overflow-y-auto leading-[22px]"
          style={{ height: "auto" }}
          onInput={(e) => {
            e.target.style.height = "auto";
            e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
          }}
        />

        {/* Send / Mic button */}
        {isEmpty ? (
          <button
            type="button"
            className="h-[42px] w-[42px] flex items-center justify-center rounded-full bg-[#00a884] text-white shrink-0 hover:bg-[#008f72] transition-colors mb-[0px]"
          >
            <Mic className="h-5 w-5" />
          </button>
        ) : (
          <button
            type="submit"
            disabled={sending}
            className="h-[42px] w-[42px] flex items-center justify-center rounded-full bg-[#00a884] text-white shrink-0 hover:bg-[#008f72] transition-colors disabled:opacity-60 mb-[0px]"
          >
            <Send className="h-5 w-5" />
          </button>
        )}
      </form>
    </div>
  );
}

// ─── Delivery Aside ───────────────────────────────────────────────────────────

const PAYMENT_OPTS = ["Dinheiro", "Pix", "Cartão"];

function DeliveryAside({ jid, chat, nicknames, onClose }) {
  const [draft, setDraft] = useState({
    name: "",
    phone: "",
    rua: "",
    numero: "",
    bairro: "",
    complemento: "",
    referencia: "",
    itens: "",
    pagamento: "Pix",
    troco: "",
    obs: "",
  });
  const [loaded, setLoaded] = useState(false);

  const draftKey = `delivery_draft_${jid}`;

  // Carrega rascunho do IDB na montagem
  useEffect(() => {
    idbGet(draftKey).then((saved) => {
      if (saved) {
        setDraft(saved);
      } else {
        const displayName = nicknames?.[jid] || chat?.name || "";
        const phone = jid?.replace("@c.us", "").replace("@s.whatsapp.net", "") || "";
        setDraft((d) => ({ ...d, name: displayName, phone }));
      }
      setLoaded(true);
    });
  }, [jid]);

  // Salva rascunho no IDB a cada mudança
  useEffect(() => {
    if (!loaded) return;
    idbSet(draftKey, draft);
  }, [draft, loaded]);

  function update(field, value) {
    setDraft((d) => ({ ...d, [field]: value }));
  }

  function handleConfirm() {
    const lines = [
      `Cliente: ${draft.name}`,
      `Telefone: ${draft.phone}`,
      `Endereço: ${draft.rua}, ${draft.numero}${draft.complemento ? ` - ${draft.complemento}` : ""}, ${draft.bairro}`,
      draft.referencia ? `Referência: ${draft.referencia}` : null,
      `Itens: ${draft.itens}`,
      `Pagamento: ${draft.pagamento}`,
      draft.pagamento === "Dinheiro" && draft.troco ? `Troco para: R$ ${draft.troco}` : null,
      draft.obs ? `Obs: ${draft.obs}` : null,
    ].filter(Boolean).join("\n");
    navigator.clipboard?.writeText(lines).catch(() => {});
    toast.success("Resumo copiado!");
    idbSet(draftKey, null);
    onClose?.();
  }

  function Field({ label, value, onChange, placeholder, multiline }) {
    return (
      <div>
        <label className="block text-[11px] font-medium text-[#54656f] mb-1">{label}</label>
        {multiline ? (
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            rows={3}
            className="w-full rounded-lg border border-[#e9edef] px-3 py-2 text-[13px] text-[#111b21] placeholder:text-[#54656f] focus:outline-none focus:border-[#25d366] resize-none"
          />
        ) : (
          <input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full rounded-lg border border-[#e9edef] px-3 py-2 text-[13px] text-[#111b21] placeholder:text-[#54656f] focus:outline-none focus:border-[#25d366]"
          />
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-[420px] bg-white border-l border-[#e9edef] shrink-0 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 h-[60px] bg-[#f0f2f5] shrink-0 border-b border-[#e9edef]">
        <div className="flex-1">
          <p className="text-[15px] font-medium text-[#111b21]">Pedido de Delivery</p>
          <p className="text-[12px] text-[#54656f] truncate">{nicknames?.[jid] || chat?.name || jid}</p>
        </div>
        <button
          onClick={onClose}
          className="h-8 w-8 flex items-center justify-center rounded-full text-[#54656f] hover:bg-[#e9edef]"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Campos */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
        <Field label="Nome do cliente" value={draft.name} onChange={(v) => update("name", v)} placeholder="Nome" />
        <Field label="Telefone" value={draft.phone} onChange={(v) => update("phone", v)} placeholder="+55..." />

        <div>
          <p className="text-[11px] font-medium text-[#54656f] mb-2">Endereço de entrega</p>
          <div className="flex flex-col gap-2">
            <Field label="Rua" value={draft.rua} onChange={(v) => update("rua", v)} placeholder="Rua / Av." />
            <div className="flex gap-2">
              <div className="flex-1">
                <Field label="Número" value={draft.numero} onChange={(v) => update("numero", v)} placeholder="Nº" />
              </div>
              <div className="flex-1">
                <Field label="Bairro" value={draft.bairro} onChange={(v) => update("bairro", v)} placeholder="Bairro" />
              </div>
            </div>
            <Field label="Complemento" value={draft.complemento} onChange={(v) => update("complemento", v)} placeholder="Apto, bloco..." />
            <Field label="Referência" value={draft.referencia} onChange={(v) => update("referencia", v)} placeholder="Perto de..." />
          </div>
        </div>

        <Field label="Itens do pedido" value={draft.itens} onChange={(v) => update("itens", v)} placeholder="Descreva os itens..." multiline />

        <div>
          <label className="block text-[11px] font-medium text-[#54656f] mb-1">Forma de pagamento</label>
          <div className="flex gap-2">
            {PAYMENT_OPTS.map((opt) => (
              <button
                key={opt}
                onClick={() => update("pagamento", opt)}
                className={cn(
                  "flex-1 py-2 rounded-lg text-[13px] font-medium border transition-colors",
                  draft.pagamento === opt
                    ? "bg-[#25d366] text-white border-[#25d366]"
                    : "bg-white text-[#54656f] border-[#e9edef] hover:border-[#25d366]"
                )}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>

        {draft.pagamento === "Dinheiro" && (
          <Field label="Troco para (R$)" value={draft.troco} onChange={(v) => update("troco", v)} placeholder="0,00" />
        )}

        <Field label="Observações" value={draft.obs} onChange={(v) => update("obs", v)} placeholder="Observações gerais..." multiline />
      </div>

      {/* Rodapé */}
      <div className="p-4 border-t border-[#e9edef] shrink-0">
        <button
          onClick={handleConfirm}
          className="w-full py-2.5 rounded-lg bg-[#25d366] text-white text-[14px] font-medium hover:bg-[#20c55e] transition-colors"
        >
          Confirmar pedido
        </button>
      </div>
    </div>
  );
}

// ─── Empty state ─────────────────────────────────────────────────────────────

function NoChat() {
  return (
    <div
      className="hidden md:flex flex-col items-center justify-center h-full text-center px-8"
      style={{ backgroundColor: "#f0f2f5" }}
    >
      <div className="flex flex-col items-center gap-4 max-w-sm">
        <div className="h-20 w-20 rounded-full bg-[#dfe5e7] flex items-center justify-center">
          <MessageCircle className="h-9 w-9 text-[#54656f]" />
        </div>
        <div>
          <p className="text-[22px] font-light text-[#41525d] mb-2">
            WhatsApp Web
          </p>
          <p className="text-[14px] text-[#54656f] leading-relaxed">
            Envie e receba mensagens sem precisar manter seu telefone conectado.
            <br />
            Use o WhatsApp em até 4 dispositivos vinculados e 1 telefone ao mesmo tempo.
          </p>
        </div>
        <div className="mt-6 flex items-center gap-2 text-[#54656f] text-[13px]">
          <span className="h-px w-8 bg-[#e9edef]" />
          Selecione uma conversa para começar
          <span className="h-px w-8 bg-[#e9edef]" />
        </div>
      </div>
    </div>
  );
}

// ─── Connect New Modal ────────────────────────────────────────────────────────

function ConnectNewModal({ onClose, onConnected }) {
  const [newSessionId, setNewSessionId] = useState(null);
  const [qrSrc, setQrSrc] = useState(null);
  const [sessionStatus, setSessionStatus] = useState("connecting");

  // Cria nova sessão ao montar
  useEffect(() => {
    fetch("/api/whatsapp/sessions", { method: "POST" })
      .then((r) => r.json())
      .then((data) => { if (data?.id) setNewSessionId(data.id); })
      .catch(() => toast.error("Erro ao iniciar nova sessão"));
  }, []);

  // Poll QR e status para a nova sessão
  useEffect(() => {
    if (!newSessionId) return;

    async function poll() {
      // Busca QR
      const qrRes = await fetch(`/api/whatsapp/qr?sid=${newSessionId}`).catch(() => null);
      if (qrRes?.ok) {
        const qrData = await qrRes.json().catch(() => null);
        if (qrData?.qr) setQrSrc(qrData.qr);
      }
      // Verifica status
      const stRes = await fetch(`/api/whatsapp/status?sid=${newSessionId}`).catch(() => null);
      if (stRes?.ok) {
        const stData = await stRes.json().catch(() => null);
        if (stData?.status) {
          setSessionStatus(stData.status);
          if (stData.status === "connected") {
            onConnected(newSessionId);
          }
        }
      }
    }

    poll();
    const interval = setInterval(poll, 3000);
    return () => clearInterval(interval);
  }, [newSessionId, onConnected]);

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#e9edef]">
          <div className="flex items-center gap-2">
            <WhatsAppIcon className="h-5 w-5 text-[#25d366]" />
            <h2 className="text-[16px] font-semibold text-[#111b21]">Conectar outra conta</h2>
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 flex items-center justify-center rounded-full text-[#54656f] hover:bg-[#f0f2f5]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-6 flex flex-col items-center gap-4">
          {sessionStatus === "connected" ? (
            <>
              <div className="h-16 w-16 rounded-full bg-[#25d366]/10 flex items-center justify-center">
                <Check className="h-8 w-8 text-[#25d366]" />
              </div>
              <p className="text-[15px] font-medium text-[#111b21]">Conta conectada!</p>
            </>
          ) : qrSrc ? (
            <>
              <p className="text-[13px] text-[#54656f] text-center">
                Abra o WhatsApp no celular &rarr; <span className="font-medium text-[#111b21]">Dispositivos conectados</span> &rarr; Escanear QR
              </p>
              <img
                src={qrSrc}
                alt="QR Code"
                className="h-52 w-52 rounded-xl border border-[#e9edef] shadow-sm"
              />
              <p className="text-[11px] text-[#54656f]">Codigo atualiza automaticamente</p>
            </>
          ) : (
            <>
              <div className="h-10 w-10 rounded-full border-2 border-[#25d366] border-t-transparent animate-spin" />
              <p className="text-[13px] text-[#54656f]">
                {!newSessionId ? "Iniciando sessao..." : "Aguardando QR code..."}
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function WhatsAppPage() {
  const router = useRouter();

  const [status, setStatus] = useState(null);
  const [user, setUser] = useState(null);
  const [qrSrc, setQrSrc] = useState(null);
  const [chats, setChats] = useState([]);
  const [chatsLoading, setChatsLoading] = useState(true);
  const [selectedChat, setSelectedChat] = useState(null);
  const [disconnecting, setDisconnecting] = useState(false);
  const [liveMessage, setLiveMessage] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const selectedChatRef = useRef(null);
  const chatsRef = useRef([]);

  // Multiplas sessoes
  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [showConnectNew, setShowConnectNew] = useState(false);
  const activeSessionIdRef = useRef(null);
  useEffect(() => { activeSessionIdRef.current = activeSessionId; }, [activeSessionId]);

  // Nicknames do MongoDB
  const [nicknames, setNicknames] = useState({}); // jid → name

  // Rótulos de marcadores de cor (MongoDB) — { red: "Urgente", ... }
  const [colorLabels, setColorLabels] = useState({});

  // Ocultar conversas (IDB)
  const [hiddenChats, setHiddenChats] = useState(new Set());

  // Cores por conversa (IDB)
  const [chatColors, setChatColors] = useState({}); // jid → colorKey

  // Asides de delivery abertos
  const [openAsides, setOpenAsides] = useState([]); // array de jids

  // Rascunho existe para o chat selecionado
  const [draftExists, setDraftExists] = useState(false);

  const fetchSessions = useCallback(async () => {
    try {
      const res = await fetch("/api/whatsapp/sessions");
      if (!res.ok) throw new Error();
      const list = await res.json();
      setSessions(Array.isArray(list) ? list : []);
      // Define sessao ativa automaticamente se ainda nao definida
      setActiveSessionId((prev) => {
        if (prev) return prev; // Mantém a atual
        const ready = list.find((s) => s.status === "connected");
        return ready?.id ?? list[0]?.id ?? null;
      });
    } catch {}
  }, []);

  const fetchStatus = useCallback(async () => {
    try {
      const sidParam = activeSessionIdRef.current ? `?sid=${activeSessionIdRef.current}` : "";
      const res = await fetch(`/api/whatsapp/status${sidParam}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setStatus(data.status ?? "disconnected");
      setUser(data.user ?? null);
      if (data.status === "qr") {
        const qrRes = await fetch(`/api/whatsapp/qr${sidParam}`);
        if (qrRes.ok) {
          const qrData = await qrRes.json();
          setQrSrc(qrData.qr ?? null);
        }
      } else {
        setQrSrc(null);
      }
    } catch {
      setStatus("disconnected");
    }
  }, []);

  const fetchChats = useCallback(async () => {
    const sid = activeSessionIdRef.current;
    const sidParam = sid ? `?sid=${sid}` : "";
    try {
      const res = await fetch(`/api/whatsapp/chats${sidParam}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      const raw = Array.isArray(data) ? data : [];
      const seen = new Set();
      const list = raw.filter((c) => { if (seen.has(c.jid)) return false; seen.add(c.jid); return true; });
      setChats(list);
    } catch {
      toast.error("Erro ao carregar conversas");
    } finally {
      setChatsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    fetchChats();
    fetchSessions();
  }, [fetchStatus, fetchChats, fetchSessions]);

  // Carrega nicknames, hidden chats, chat colors e marcadores na inicialização
  useEffect(() => {
    // Marcadores de cor (MongoDB)
    fetch("/api/whatsapp/config")
      .then((r) => r.json())
      .then((d) => { if (d.colorLabels) setColorLabels(d.colorLabels); })
      .catch(() => {});

    // Nicknames
    fetch("/api/whatsapp/nicknames")
      .then((r) => r.json())
      .then((list) => {
        if (Array.isArray(list)) {
          const map = {};
          for (const { jid, name } of list) map[jid] = name;
          setNicknames(map);
        }
      })
      .catch(() => {});

    // Hidden chats do IDB
    idbGet("hidden_chats").then((list) => {
      if (Array.isArray(list)) setHiddenChats(new Set(list));
    });

    // Chat colors do IDB
    idbGet("chat_colors").then((map) => {
      if (map && typeof map === "object") setChatColors(map);
    });
  }, []);

  // Verifica rascunho de delivery para o chat selecionado
  useEffect(() => {
    if (!selectedChat) { setDraftExists(false); return; }
    idbGet(`delivery_draft_${selectedChat.jid}`).then((d) => setDraftExists(!!d));
  }, [selectedChat, openAsides]);

  // Polling adaptativo: 3s quando desconectado/QR (aguarda reconexão), 30s quando conectado
  useEffect(() => {
    const delay = status === "connected" ? 30000 : 3000;
    const interval = setInterval(() => {
      fetchStatus();
      fetchSessions();
    }, delay);
    return () => clearInterval(interval);
  }, [fetchStatus, fetchSessions, status]);

  async function handleDisconnect() {
    setDisconnecting(true);
    try {
      const sidParam = activeSessionId ? `?sid=${activeSessionId}` : "";
      await fetch(`/api/whatsapp/logout${sidParam}`, { method: "DELETE" });
      // Remove sessao ativa da lista
      setSessions((prev) => prev.filter((s) => s.id !== activeSessionId));
      // Troca para outra sessao se houver
      setActiveSessionId((prev) => {
        const remaining = sessions.filter((s) => s.id !== prev && s.status === "connected");
        return remaining[0]?.id ?? null;
      });
      setSelectedChat(null);
      setChats([]);
      setUser(null);
      if (sessions.filter((s) => s.status === "connected").length <= 1) {
        setStatus("disconnected");
      }
      toast.success("Conta desconectada");
      fetchSessions();
    } catch {
      toast.error("Erro ao desconectar");
    } finally {
      setDisconnecting(false);
    }
  }

  function handleSwitchSession(sid) {
    setActiveSessionId(sid);
  }

  // Recarrega chats quando sessao ativa muda
  useEffect(() => {
    if (activeSessionId) {
      setSelectedChat(null);
      setChats([]);
      setChatsLoading(true);
      fetchChats();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSessionId]);

  // Mantém refs sincronizadas para uso em closures SSE (sem stale closure)
  useEffect(() => { selectedChatRef.current = selectedChat; }, [selectedChat]);
  useEffect(() => { chatsRef.current = chats; }, [chats]);

  // Recarrega chats quando volta a conectar após ter estado desconectado
  const prevStatusRef = useRef(null);
  useEffect(() => {
    if (prevStatusRef.current !== "connected" && status === "connected") {
      fetchChats();
    }
    prevStatusRef.current = status;
  }, [status, fetchChats]);

  // Socket.IO — atualizações em tempo real (OpenWA /events namespace)
  const socketRef = useRef(null);

  // Normaliza mensagem do formato OpenWA para o formato interno do frontend
  const normalizeOwMsg = useCallback((data) => {
    const TYPE_MAP = {
      text: "conversation", image: "imageMessage", video: "videoMessage",
      audio: "audioMessage", voice: "pttMessage", document: "documentMessage",
      sticker: "stickerMessage", location: "locationMessage",
    };
    const quoted = data.quotedMessage
      ? { id: data.quotedMessage.id, text: data.quotedMessage.body ?? "" }
      : null;
    let text = data.body ?? "";
    if (!text && data.media?.filename) text = data.media.filename;
    return {
      id: data.id ?? data.waMessageId,
      jid: data.chatId,
      fromMe: !!data.fromMe,
      participant: data.author ?? null,
      timestamp: data.timestamp ?? Math.floor(Date.now() / 1000),
      text,
      type: TYPE_MAP[data.type] ?? data.type ?? "unknown",
      status: data.status ?? null,
      quotedMessage: quoted,
    };
  }, []);

  useEffect(() => {
    if (status !== "connected") {
      if (socketRef.current) { socketRef.current.disconnect(); socketRef.current = null; }
      return;
    }
    if (socketRef.current) return;

    let cancelled = false;

    fetch("/api/whatsapp/socket-credentials")
      .then((r) => r.json())
      .then(({ url, token }) => {
        if (cancelled) return;

        // OpenWA: auth via apiKey, namespace já incluso na url (/events)
        const socket = io(url, {
          auth: { apiKey: token },
          extraHeaders: { "X-API-Key": token },
          transports: ["websocket"],
          reconnectionDelay: 2000,
          reconnectionDelayMax: 10000,
        });

        socket.on("connect", () => {
          console.log("[ws] conectado:", socket.id);
          // OpenWA requer subscrição explícita após conexão
          socket.emit("message", { type: "subscribe", sessionId: "*", events: ["*"] });
        });
        socket.on("disconnect", (reason) => console.log("[ws] desconectado:", reason));
        socket.on("connect_error", (err) => console.error("[ws] erro:", err.message));

        // OpenWA entrega eventos via evento "message" com envelope { type, payload }
        socket.on("message", (data) => {
          if (data.type !== "event") return;
          const { event, data: eventData, sessionId: msgSessionId } = data.payload;

          // Ignora eventos de outras sessoes
          if (msgSessionId && activeSessionIdRef.current && msgSessionId !== activeSessionIdRef.current) return;

          if (event === "message.received" || event === "message.sent") {
            const msg = normalizeOwMsg(eventData);
            setLiveMessage(msg);

            const existsInList = chatsRef.current.some((c) => c.jid === msg.jid);
            if (!existsInList) { fetchChats(); return; }

            setChats((prev) => {
              const idx = prev.findIndex((c) => c.jid === msg.jid);
              if (idx === -1) return prev;
              const current = prev[idx];
              const isOpen = selectedChatRef.current?.jid === msg.jid;
              const updated = {
                ...current,
                lastMessage: msg,
                timestamp: msg.timestamp,
                unreadCount: isOpen ? 0 : (current.unreadCount || 0) + 1,
              };
              const next = [...prev];
              next.splice(idx, 1);
              return [updated, ...next];
            });
          }

          if (event === "session.status") {
            const newStatus = eventData?.status;
            if (newStatus === "ready") fetchChats();
            if (newStatus === "disconnected" || newStatus === "failed") {
              setStatus("disconnected");
            }
          }
        });

        socketRef.current = socket;
      })
      .catch(() => {});

    return () => { cancelled = true; };
  }, [status, fetchChats, normalizeOwMsg]);

  useEffect(() => () => { socketRef.current?.disconnect(); socketRef.current = null; }, []);

  // ── Callbacks ──────────────────────────────────────────────────────────────

  async function handleSetNickname(jid, name) {
    try {
      const res = await fetch("/api/whatsapp/nicknames", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jid, name }),
      });
      if (res.ok) {
        setNicknames((prev) => ({ ...prev, [jid]: name }));
        setChats((prev) => prev.map((c) => c.jid === jid ? { ...c, name } : c));
      }
    } catch {}
  }

  async function handleHideChat(jid) {
    const next = new Set(hiddenChats);
    next.add(jid);
    setHiddenChats(next);
    await idbSet("hidden_chats", [...next]);
    if (selectedChat?.jid === jid) setSelectedChat(null);
  }

  async function handleSetColor(jid, colorKey) {
    const next = { ...chatColors };
    if (colorKey === null) delete next[jid];
    else next[jid] = colorKey;
    setChatColors(next);
    await idbSet("chat_colors", next);
  }

  function handleMarkRead(jid) {
    fetch(`/api/whatsapp/chats/${encodeURIComponent(jid)}/read`, { method: "POST" }).catch(() => {});
    setChats((prev) => prev.map((c) => c.jid === jid ? { ...c, unreadCount: 0 } : c));
  }

  function openDeliveryAside(jid) {
    if (!openAsides.includes(jid)) setOpenAsides((prev) => [...prev, jid]);
  }

  function closeDeliveryAside(jid) {
    setOpenAsides((prev) => prev.filter((j) => j !== jid));
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  const isConnected = status === "connected";

  if (status !== null && !isConnected) {
    return (
      <div style={{ height: "calc(100vh - 3.5rem)" }}>
        <NotConnectedScreen status={status} qrSrc={qrSrc} onRefresh={fetchStatus} />
      </div>
    );
  }

  return (
    <div
      className="flex overflow-hidden"
      style={{ height: "calc(100vh - 3.5rem)" }}
    >
      {/* Left panel */}
      <div
        className={cn(
          "flex flex-col w-full md:w-[360px] lg:w-[420px] border-r border-[#e9edef] bg-white shrink-0",
          selectedChat ? "hidden md:flex" : "flex"
        )}
      >
        {/* Left header — ConnectedBar or skeleton */}
        {status === null ? (
          <div className="flex items-center gap-3 px-4 h-[60px] bg-[#f0f2f5] shrink-0">
            <Skeleton className="h-10 w-10 rounded-full" />
            <Skeleton className="h-3.5 w-24" />
          </div>
        ) : (
          <ConnectedBar
            user={user}
            sessions={sessions}
            activeSessionId={activeSessionId}
            onSwitchSession={handleSwitchSession}
            onConnectNew={() => setShowConnectNew(true)}
            onDisconnect={handleDisconnect}
            disconnecting={disconnecting}
            onSettings={() => router.push("/whatsapp/configuracoes")}
          />
        )}

        {/* Search bar */}
        <SearchBar value={searchQuery} onChange={setSearchQuery} />

        {/* Chat list */}
        <div className="flex-1 overflow-y-auto bg-white">
          {chatsLoading ? (
            <ChatListSkeleton />
          ) : (() => {
            const q = searchQuery.trim().toLowerCase();
            const filtered = q
              ? chats.filter((c) =>
                  !hiddenChats.has(c.jid) &&
                  ((c.name || "").toLowerCase().includes(q) || (c.jid || "").toLowerCase().includes(q))
                )
              : chats.filter((c) => !hiddenChats.has(c.jid));
            if (filtered.length === 0) return (
              <div className="flex flex-col items-center justify-center py-20 text-center px-8">
                <div className="h-12 w-12 rounded-full bg-[#f0f2f5] flex items-center justify-center mb-3">
                  <MessageCircle className="h-5 w-5 text-[#54656f]" />
                </div>
                <p className="text-sm text-[#54656f]">
                  {q ? "Nenhuma conversa encontrada" : "Sem conversas"}
                </p>
              </div>
            );
            return (
              <div>
                {filtered.map((chat) => (
                  <ChatItem
                    key={chat.jid}
                    chat={chat}
                    selected={selectedChat?.jid === chat.jid}
                    color={chatColors[chat.jid] || null}
                    nickname={nicknames[chat.jid] || null}
                    colorLabels={colorLabels}
                    onClick={() => {
                      setSelectedChat(chat);
                      if (chat.unreadCount > 0) {
                        setChats((prev) =>
                          prev.map((c) => c.jid === chat.jid ? { ...c, unreadCount: 0 } : c)
                        );
                        fetch(`/api/whatsapp/chats/${encodeURIComponent(chat.jid)}/read`, { method: "POST" }).catch(() => {});
                      }
                    }}
                    onMarkRead={() => handleMarkRead(chat.jid)}
                    onSetNickname={handleSetNickname}
                    onHide={() => handleHideChat(chat.jid)}
                    onSetColor={handleSetColor}
                  />
                ))}
              </div>
            );
          })()}
        </div>
      </div>

      {/* Right panel */}
      <div
        className={cn(
          "flex-1 overflow-hidden",
          selectedChat ? "flex flex-col" : "hidden md:flex md:flex-col"
        )}
      >
        {selectedChat ? (
          <MessagesPanel
            chat={selectedChat}
            sessionId={activeSessionId}
            onBack={() => setSelectedChat(null)}
            liveMessage={liveMessage}
            hasDraft={draftExists}
            onOpenDelivery={() => openDeliveryAside(selectedChat.jid)}
            onSent={(msg) => {
              setChats((prev) => {
                const idx = prev.findIndex((c) => c.jid === msg.jid);
                if (idx === -1) return prev;
                const updated = { ...prev[idx], lastMessage: msg, timestamp: msg.timestamp };
                const next = [...prev];
                next.splice(idx, 1);
                return [updated, ...next];
              });
            }}
          />
        ) : (
          <NoChat />
        )}
      </div>

      {/* Delivery Aside — exibe apenas o do chat selecionado, se estiver aberto */}
      {selectedChat && openAsides.includes(selectedChat.jid) && (
        <DeliveryAside
          key={selectedChat.jid}
          jid={selectedChat.jid}
          chat={selectedChat}
          nicknames={nicknames}
          onClose={() => closeDeliveryAside(selectedChat.jid)}
        />
      )}

      {/* Modal de conectar nova conta */}
      {showConnectNew && (
        <ConnectNewModal
          onClose={() => setShowConnectNew(false)}
          onConnected={(sid) => {
            setShowConnectNew(false);
            fetchSessions();
            handleSwitchSession(sid);
          }}
        />
      )}
    </div>
  );
}
