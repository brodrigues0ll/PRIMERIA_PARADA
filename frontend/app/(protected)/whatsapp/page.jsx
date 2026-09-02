"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { io } from "socket.io-client";
import {
  ChevronLeft,
  Send,
  MessageCircle,
  LogOut,
  RefreshCw,
  Search,
  MoreVertical,
  Phone,
  Smile,
  Mic,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import WhatsAppIcon from "@/components/icons/WhatsAppIcon";

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

function ConnectedBar({ user, onDisconnect, disconnecting }) {
  return (
    <div className="flex items-center gap-3 px-4 h-[60px] bg-[#f0f2f5] shrink-0">
      {/* Avatar do usuário conectado */}
      <div className="h-10 w-10 rounded-full bg-[#dfe5e7] flex items-center justify-center shrink-0 text-sm font-semibold text-[#54656f] overflow-hidden">
        {user?.name ? getInitial(user.name) : <WhatsAppIcon className="h-5 w-5 text-[#54656f]" />}
      </div>

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
        onClick={onDisconnect}
        disabled={disconnecting}
        className="flex items-center gap-1.5 text-xs text-[#54656f] hover:text-red-500 transition-colors disabled:opacity-50"
        title="Desconectar"
      >
        <LogOut className="h-4 w-4" />
        {disconnecting ? "Saindo…" : "Sair"}
      </button>
    </div>
  );
}

// ─── Search bar ──────────────────────────────────────────────────────────────

function SearchBar() {
  return (
    <div className="px-3 py-2 bg-[#f0f2f5] shrink-0">
      <div className="flex items-center gap-2 bg-white rounded-full px-3 h-9">
        <Search className="h-4 w-4 text-[#54656f] shrink-0" />
        <input
          type="text"
          placeholder="Pesquisar ou começar uma conversa"
          className="flex-1 text-[13px] text-[#111b21] placeholder:text-[#54656f] bg-transparent focus:outline-none"
          readOnly
        />
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

function ChatItem({ chat, selected, onClick }) {
  const preview = chat.lastMessage?.text
    ? truncate(chat.lastMessage.text)
    : "Sem mensagens";
  const time = formatTime(chat.lastMessage?.timestamp || chat.timestamp);

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-4 py-3 text-left transition-colors border-b border-[#e9edef]",
        selected ? "bg-[#f0f2f5]" : "bg-white hover:bg-[#f5f6f6]"
      )}
    >
      <ChatAvatar jid={chat.jid} name={chat.name} size="lg" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-0.5">
          <span className="text-[15px] font-normal text-[#111b21] truncate">
            {chat.name || chat.jid}
          </span>
          <span
            className={cn(
              "text-[12px] shrink-0",
              chat.unreadCount > 0 ? "text-[#25d366]" : "text-[#54656f]"
            )}
          >
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
  );
}

// ─── Message Bubble ──────────────────────────────────────────────────────────

const MEDIA_TYPES = new Set(["imageMessage", "stickerMessage", "videoMessage"])

function MediaContent({ msg }) {
  const encodedJid = encodeURIComponent(msg.jid)
  const src = `/api/whatsapp/chats/${encodedJid}/messages/${msg.id}/media`
  const isSticker = msg.type === "stickerMessage"

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

  return (
    <img
      src={src}
      alt={msg.text || "imagem"}
      className="max-w-full rounded-[6px] max-h-64 object-cover cursor-pointer"
      loading="lazy"
    />
  )
}

function MessageBubble({ msg }) {
  const isMine = msg.fromMe;
  const isMedia = MEDIA_TYPES.has(msg.type)
  const isSticker = msg.type === "stickerMessage"

  if (isSticker) {
    return (
      <div className={cn("flex", isMine ? "justify-end" : "justify-start")}>
        <div className="max-w-[65%]">
          <MediaContent msg={msg} />
          <div className={cn("flex items-center gap-1 justify-end mt-0.5")}>
            <span className="text-[11px] text-[#667781]">{formatHour(msg.timestamp)}</span>
            {isMine && <span className="text-[#53bdeb] text-[13px] leading-none">✓✓</span>}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={cn("flex", isMine ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "relative max-w-[65%] text-[14px] leading-[19px]",
          isMine
            ? "bg-[#d9fdd3] rounded-[7.5px] rounded-tr-none"
            : "bg-white rounded-[7.5px] rounded-tl-none shadow-[0_1px_2px_rgba(0,0,0,0.13)]",
          isMedia ? "p-[3px]" : "px-[9px] pt-[6px] pb-[8px]"
        )}
      >
        {isMedia && <MediaContent msg={msg} />}
        {msg.text && !isMedia && (
          <p className="break-words whitespace-pre-wrap text-[#111b21] pr-10">{msg.text}</p>
        )}
        {msg.text && isMedia && (
          <p className="break-words whitespace-pre-wrap text-[#111b21] px-[6px] pb-[2px] pt-[4px] pr-10">{msg.text}</p>
        )}
        <div className={cn("flex items-center gap-1 justify-end", isMedia ? "px-[6px] pb-[4px] mt-[-4px]" : "mt-[-4px]")}>
          <span className="text-[11px] text-[#667781] whitespace-nowrap">
            {formatHour(msg.timestamp)}
          </span>
          {isMine && (
            <span className="text-[#53bdeb] text-[13px] leading-none">✓✓</span>
          )}
        </div>
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

function MessagesPanel({ chat, onBack, liveMessage, onSent }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const scrollAreaRef = useRef(null);
  const inputRef = useRef(null);
  const encodedJid = encodeURIComponent(chat.jid);

  const fetchMessages = useCallback(async () => {
    try {
      const res = await fetch(`/api/whatsapp/chats/${encodedJid}/messages?limit=50`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      const list = Array.isArray(data) ? data : [];
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
  }, [encodedJid]);

  useEffect(() => {
    fetch(`/api/whatsapp/chats/${encodedJid}/read`, { method: "POST" }).catch(() => {});
  }, [encodedJid]);

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
    console.log("[panel] live jid:", liveMessage.jid, "| chat jid:", chat.jid, "| match:", liveMessage.jid === chat.jid);
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
    };
    setMessages((prev) => [...prev, optimistic]);
    onSent?.(optimistic);

    try {
      const res = await fetch(`/api/whatsapp/chats/${encodedJid}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: trimmed }),
      });
      if (!res.ok) {
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
        setText(trimmed);
        throw new Error();
      }
      const data = await res.json();
      // Troca o id temporário pelo id real assim que o servidor confirma
      if (data?.id) {
        setMessages((prev) =>
          prev.map((m) => (m.id === tempId ? { ...m, id: data.id } : m))
        );
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
        <div className="flex-1 min-w-0">
          <p className="text-[15px] font-medium text-[#111b21] truncate leading-tight">
            {chat.name || chat.jid}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <button className="h-9 w-9 flex items-center justify-center rounded-full text-[#54656f] hover:bg-[#e9edef] transition-colors">
            <Phone className="h-5 w-5" />
          </button>
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
              <MessageBubble key={msg.id} msg={msg} />
            ))}
          </div>
        )}
      </div>

      {/* Input area */}
      <form
        onSubmit={handleSend}
        className="flex items-center gap-3 px-4 py-3 bg-[#f0f2f5] shrink-0"
      >
        {/* Emoji icon */}
        <button
          type="button"
          className="h-9 w-9 flex items-center justify-center text-[#54656f] hover:text-[#111b21] shrink-0 transition-colors"
        >
          <Smile className="h-[22px] w-[22px]" />
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
            className="h-[42px] w-[42px] flex items-center justify-center rounded-full bg-[#00a884] text-white shrink-0 hover:bg-[#008f72] transition-colors"
          >
            <Mic className="h-5 w-5" />
          </button>
        ) : (
          <button
            type="submit"
            disabled={sending}
            className="h-[42px] w-[42px] flex items-center justify-center rounded-full bg-[#00a884] text-white shrink-0 hover:bg-[#008f72] transition-colors disabled:opacity-60"
          >
            <Send className="h-5 w-5" />
          </button>
        )}
      </form>
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

// ─── Page ────────────────────────────────────────────────────────────────────

export default function WhatsAppPage() {
  const [status, setStatus] = useState(null);
  const [user, setUser] = useState(null);
  const [qrSrc, setQrSrc] = useState(null);
  const [chats, setChats] = useState([]);
  const [chatsLoading, setChatsLoading] = useState(true);
  const [selectedChat, setSelectedChat] = useState(null);
  const [disconnecting, setDisconnecting] = useState(false);
  const [liveMessage, setLiveMessage] = useState(null);
  const selectedChatRef = useRef(null);
  const chatsRef = useRef([]);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/whatsapp/status");
      if (!res.ok) throw new Error();
      const data = await res.json();
      setStatus(data.status ?? "disconnected");
      setUser(data.user ?? null);
      if (data.status === "qr") {
        const qrRes = await fetch("/api/whatsapp/qr");
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
    try {
      const res = await fetch("/api/whatsapp/chats");
      if (!res.ok) throw new Error();
      const data = await res.json();
      const list = Array.isArray(data) ? data : [];
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
  }, [fetchStatus, fetchChats]);

  // Polling adaptativo: 3s quando desconectado/QR (aguarda reconexão), 30s quando conectado
  useEffect(() => {
    const delay = status === "connected" ? 30000 : 3000;
    const interval = setInterval(fetchStatus, delay);
    return () => clearInterval(interval);
  }, [fetchStatus, status]);

  async function handleDisconnect() {
    setDisconnecting(true);
    try {
      await fetch("/api/whatsapp/logout", { method: "DELETE" });
      setSelectedChat(null);
      setChats([]);
      setUser(null);
      setStatus("disconnected");
      toast.success("WhatsApp desconectado — escaneie o QR para reconectar");
      fetchStatus(); // inicia polling de 3s automaticamente via useEffect de status
    } catch {
      toast.error("Erro ao desconectar");
    } finally {
      setDisconnecting(false);
    }
  }

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

  // Socket.IO — atualizações em tempo real
  const socketRef = useRef(null);

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

        const socket = io(url, {
          auth: { token },
          transports: ["websocket"],
          reconnectionDelay: 2000,
          reconnectionDelayMax: 10000,
        });

        socket.on("connect", () => console.log("[ws] conectado:", socket.id));
        socket.on("disconnect", (reason) => console.log("[ws] desconectado:", reason));
        socket.on("connect_error", (err) => console.error("[ws] erro:", err.message));

        socket.on("message", (msg) => {
          console.log("[ws] msg recebida — fromMe:", msg.fromMe, "| texto:", msg.text?.slice(0, 50));
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
        });

        socket.on("connection", (data) => {
          if (data.user) setUser(data.user);
          if (data.loggedOut) { setStatus("disconnected"); }
        });

        socketRef.current = socket;
      })
      .catch(() => {});

    return () => { cancelled = true; };
  }, [status, fetchChats]);

  useEffect(() => () => { socketRef.current?.disconnect(); socketRef.current = null; }, []);

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
          <ConnectedBar user={user} onDisconnect={handleDisconnect} disconnecting={disconnecting} />
        )}

        {/* Search bar */}
        <SearchBar />

        {/* Chat list */}
        <div className="flex-1 overflow-y-auto bg-white">
          {chatsLoading ? (
            <ChatListSkeleton />
          ) : chats.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center px-8">
              <div className="h-12 w-12 rounded-full bg-[#f0f2f5] flex items-center justify-center mb-3">
                <MessageCircle className="h-5 w-5 text-[#54656f]" />
              </div>
              <p className="text-sm text-[#54656f]">Nenhuma conversa encontrada</p>
            </div>
          ) : (
            <div>
              {chats.map((chat) => (
                <ChatItem
                  key={chat.jid}
                  chat={chat}
                  selected={selectedChat?.jid === chat.jid}
                  onClick={() => {
                    setSelectedChat(chat);
                    if (chat.unreadCount > 0) {
                      setChats((prev) =>
                        prev.map((c) => c.jid === chat.jid ? { ...c, unreadCount: 0 } : c)
                      );
                    }
                  }}
                />
              ))}
            </div>
          )}
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
            onBack={() => setSelectedChat(null)}
            liveMessage={liveMessage}
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
    </div>
  );
}
