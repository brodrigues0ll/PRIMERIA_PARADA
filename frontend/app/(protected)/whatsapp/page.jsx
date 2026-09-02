"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { ChevronLeft, Send, MessageCircle, LogOut, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
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
    <div className="flex flex-col items-center justify-center h-full px-8 text-center gap-6">
      <div className="h-16 w-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
        <WhatsAppIcon className="h-8 w-8 text-emerald-600" />
      </div>

      {isQR && qrSrc ? (
        <>
          <div>
            <p className="text-base font-semibold text-foreground mb-1">Conectar WhatsApp</p>
            <p className="text-sm text-muted-foreground">
              Abra o WhatsApp no celular, vá em{" "}
              <span className="font-medium text-foreground">Dispositivos conectados</span> e
              escaneie o QR code abaixo
            </p>
          </div>
          <img
            src={qrSrc}
            alt="QR Code WhatsApp"
            className="h-56 w-56 rounded-2xl border border-border shadow-sm"
          />
          <p className="text-xs text-muted-foreground">
            O código expira em 60 segundos — será atualizado automaticamente
          </p>
        </>
      ) : isQR && !qrSrc ? (
        <>
          <p className="text-sm text-muted-foreground">Gerando QR code…</p>
          <Skeleton className="h-56 w-56 rounded-2xl" />
        </>
      ) : isConnecting ? (
        <>
          <p className="text-base font-semibold text-foreground">Conectando…</p>
          <p className="text-sm text-muted-foreground">Aguarde enquanto o WhatsApp é inicializado</p>
          <div className="h-8 w-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
        </>
      ) : (
        <>
          <div>
            <p className="text-base font-semibold text-foreground mb-1">WhatsApp desconectado</p>
            <p className="text-sm text-muted-foreground">
              O serviço não está respondendo ou a sessão expirou
            </p>
          </div>
          <Button variant="outline" onClick={onRefresh} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Tentar novamente
          </Button>
        </>
      )}
    </div>
  );
}

// ─── Status bar (connected) ──────────────────────────────────────────────────

function ConnectedBar({ user, onDisconnect, disconnecting }) {
  return (
    <div className="flex items-center gap-3 px-4 py-2.5 border-b border-border bg-card shrink-0">
      <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-foreground leading-none">Conectado</p>
        {user?.name && (
          <p className="text-[11px] text-muted-foreground truncate mt-0.5">{user.name}</p>
        )}
      </div>
      <button
        onClick={onDisconnect}
        disabled={disconnecting}
        className="flex items-center gap-1.5 text-xs text-destructive hover:text-destructive/80 transition-colors disabled:opacity-50"
      >
        <LogOut className="h-3.5 w-3.5" />
        {disconnecting ? "Saindo…" : "Desconectar"}
      </button>
    </div>
  );
}

// ─── Chat List ───────────────────────────────────────────────────────────────

function ChatListSkeleton() {
  return (
    <div className="flex flex-col">
      {[...Array(6)].map((_, i) => (
        <div key={i}>
          <div className="flex items-center gap-3 px-4 py-3">
            <Skeleton className="h-10 w-10 rounded-full shrink-0" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-3.5 w-32" />
              <Skeleton className="h-3 w-48" />
            </div>
            <Skeleton className="h-3 w-10 shrink-0" />
          </div>
          {i < 5 && <Separator />}
        </div>
      ))}
    </div>
  );
}

function ChatAvatar({ jid, name }) {
  const [err, setErr] = useState(false);
  const src = `/api/whatsapp/chats/${encodeURIComponent(jid)}/picture`;
  return (
    <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 text-sm font-semibold overflow-hidden">
      {!err ? (
        <img src={src} alt="" className="h-10 w-10 object-cover" onError={() => setErr(true)} />
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
        "w-full flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50",
        selected && "bg-muted"
      )}
    >
      <ChatAvatar jid={chat.jid} name={chat.name} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-0.5">
          <span className="text-sm font-medium text-foreground truncate">{chat.name || chat.jid}</span>
          <span className="text-[10px] text-muted-foreground shrink-0">{time}</span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs text-muted-foreground truncate">{preview}</span>
          {chat.unreadCount > 0 && (
            <Badge className="h-4 min-w-4 px-1 text-[10px] shrink-0 bg-primary text-primary-foreground">
              {chat.unreadCount}
            </Badge>
          )}
        </div>
      </div>
    </button>
  );
}

// ─── Message Bubble ──────────────────────────────────────────────────────────

function MessageBubble({ msg }) {
  const isMine = msg.fromMe;
  return (
    <div className={cn("flex", isMine ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[75%] rounded-2xl px-3 py-2 text-sm",
          isMine
            ? "bg-primary text-primary-foreground rounded-br-sm"
            : "bg-card border border-border text-foreground rounded-bl-sm"
        )}
      >
        <p className="break-words whitespace-pre-wrap leading-snug">{msg.text || ""}</p>
        <p
          className={cn(
            "text-[10px] mt-1 text-right",
            isMine ? "text-primary-foreground/70" : "text-muted-foreground"
          )}
        >
          {formatHour(msg.timestamp)}
        </p>
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
          <Skeleton className={cn("h-12 rounded-2xl", i % 2 === 0 ? "w-48" : "w-36")} />
        </div>
      ))}
    </div>
  );
}

function MessagesPanel({ chat, onBack }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const scrollAreaRef = useRef(null);
  const encodedJid = encodeURIComponent(chat.jid);

  const fetchMessages = useCallback(async () => {
    try {
      const res = await fetch(`/api/whatsapp/chats/${encodedJid}/messages?limit=50`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setMessages(Array.isArray(data) ? data : []);
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
    setLoading(true);
    setMessages([]);
    fetchMessages();
  }, [fetchMessages]);

  useEffect(() => {
    if (!loading && scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages, loading]);

  async function handleSend(e) {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    setSending(true);
    try {
      const res = await fetch(`/api/whatsapp/chats/${encodedJid}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: trimmed }),
      });
      if (!res.ok) throw new Error();
      setText("");
      await fetchMessages();
    } catch {
      toast.error("Erro ao enviar mensagem");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-4 h-14 border-b border-border bg-background/80 backdrop-blur-md shrink-0">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-foreground md:hidden"
          onClick={onBack}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <ChatAvatar jid={chat.jid} name={chat.name} />
        <span className="text-sm font-semibold text-foreground truncate">{chat.name || chat.jid}</span>
      </div>

      <div ref={scrollAreaRef} className="flex-1 overflow-y-auto px-4 py-4">
        {loading ? (
          <MessagesSkeleton />
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-16 text-center">
            <div className="h-12 w-12 rounded-2xl bg-muted flex items-center justify-center mb-3">
              <MessageCircle className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">Nenhuma mensagem ainda</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {messages.map((msg) => (
              <MessageBubble key={msg.id} msg={msg} />
            ))}
          </div>
        )}
      </div>

      <form
        onSubmit={handleSend}
        className="flex items-center gap-2 px-4 py-3 border-t border-border bg-background shrink-0"
      >
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Digite uma mensagem..."
          className="flex-1 h-10 rounded-xl border border-border bg-card px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          disabled={sending}
        />
        <Button
          type="submit"
          size="icon"
          className="h-10 w-10 rounded-xl shrink-0"
          disabled={sending || !text.trim()}
        >
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}

// ─── Empty state ─────────────────────────────────────────────────────────────

function NoChat() {
  return (
    <div className="hidden md:flex flex-col items-center justify-center h-full text-center px-8">
      <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
        <MessageCircle className="h-7 w-7 text-muted-foreground" />
      </div>
      <p className="text-sm font-semibold text-foreground mb-1">Selecione uma conversa</p>
      <p className="text-xs text-muted-foreground">Escolha um chat na lista ao lado</p>
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
      setChats(Array.isArray(data) ? data : []);
    } catch {
      toast.error("Erro ao carregar conversas");
    } finally {
      setChatsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    fetchChats();
    const interval = setInterval(fetchStatus, 15000);
    return () => clearInterval(interval);
  }, [fetchStatus, fetchChats]);

  async function handleDisconnect() {
    setDisconnecting(true);
    try {
      await fetch("/api/whatsapp/logout", { method: "DELETE" });
      setSelectedChat(null);
      setChats([]);
      setUser(null);
      toast.success("WhatsApp desconectado");
      await fetchStatus();
    } catch {
      toast.error("Erro ao desconectar");
    } finally {
      setDisconnecting(false);
    }
  }

  const isConnected = status === "connected";

  if (status !== null && !isConnected) {
    return (
      <div style={{ height: "calc(100vh - 3.5rem)" }}>
        <NotConnectedScreen status={status} qrSrc={qrSrc} onRefresh={fetchStatus} />
      </div>
    );
  }

  return (
    <div className="flex overflow-hidden" style={{ height: "calc(100vh - 3.5rem)" }}>
      {/* Left panel */}
      <div
        className={cn(
          "flex flex-col w-full md:w-80 lg:w-96 border-r border-border bg-background shrink-0",
          selectedChat ? "hidden md:flex" : "flex"
        )}
      >
        {status === null ? (
          <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border bg-card">
            <Skeleton className="h-2 w-2 rounded-full" />
            <Skeleton className="h-3.5 w-24" />
          </div>
        ) : (
          <ConnectedBar user={user} onDisconnect={handleDisconnect} disconnecting={disconnecting} />
        )}

        <div className="flex-1 overflow-y-auto">
          {chatsLoading ? (
            <ChatListSkeleton />
          ) : chats.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center px-8">
              <div className="h-12 w-12 rounded-2xl bg-muted flex items-center justify-center mb-3">
                <MessageCircle className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">Nenhuma conversa encontrada</p>
            </div>
          ) : (
            <div>
              {chats.map((chat, i) => (
                <div key={chat.jid}>
                  <ChatItem
                    chat={chat}
                    selected={selectedChat?.jid === chat.jid}
                    onClick={() => setSelectedChat(chat)}
                  />
                  {i < chats.length - 1 && <Separator />}
                </div>
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
          <MessagesPanel chat={selectedChat} onBack={() => setSelectedChat(null)} />
        ) : (
          <NoChat />
        )}
      </div>
    </div>
  );
}
