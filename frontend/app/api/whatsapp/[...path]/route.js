import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

const OW_URL = process.env.WA_INTERNAL_URL ?? "http://whatsapp:2785";
const OW_KEY = process.env.WA_API_KEY ?? "";

// ── OpenWA fetch helper ────────────────────────────────────────────────────────

async function owFetch(method, path, body) {
  const url = `${OW_URL}/api${path}`;
  const init = {
    method,
    headers: { "X-API-Key": OW_KEY, "Content-Type": "application/json" },
  };
  if (body !== undefined) init.body = JSON.stringify(body);
  const res = await fetch(url, init);
  return { res, json: await res.json().catch(() => null) };
}

async function owFetchRaw(method, path) {
  const url = `${OW_URL}/api${path}`;
  return fetch(url, {
    method,
    headers: { "X-API-Key": OW_KEY },
  });
}

// ── Session discovery & auto-creation ─────────────────────────────────────────

let _sessionId = null;
let _sessionExpiry = 0;

async function getSession(preferredSid) {
  if (preferredSid) {
    // Verifica se existe e inicia o engine se necessário
    try {
      const { json: sessions } = await owFetch("GET", "/sessions");
      const list = Array.isArray(sessions) ? sessions : [];
      const found = list.find((s) => s.id === preferredSid);
      if (found && !found.engineLoaded) {
        await owFetch("POST", `/sessions/${preferredSid}/start`).catch(() => {});
      }
    } catch {}
    return preferredSid;
  }

  if (_sessionId && Date.now() < _sessionExpiry) return _sessionId;
  try {
    const { json: sessions } = await owFetch("GET", "/sessions");
    const list = Array.isArray(sessions) ? sessions : [];
    if (list.length === 0) {
      // Cria sessão padrão na primeira execução
      const { json: created } = await owFetch("POST", "/sessions", { name: "default" });
      if (created?.id) {
        await owFetch("POST", `/sessions/${created.id}/start`);
        _sessionId = created.id;
        _sessionExpiry = Date.now() + 15_000;
        return _sessionId;
      }
      return null;
    }
    const session = list.find((s) => s.status === "ready") || list[0];
    _sessionId = session?.id ?? null;
    // Inicia o engine se a sessão existe mas não está carregada
    if (_sessionId && !session.engineLoaded) {
      await owFetch("POST", `/sessions/${_sessionId}/start`).catch(() => {});
    }
    _sessionExpiry = Date.now() + 30_000;
    return _sessionId;
  } catch {
    return null;
  }
}

// Invalida cache de sessão quando o status muda (logout, etc.)
function invalidateSession() {
  _sessionId = null;
  _sessionExpiry = 0;
}

// ── Format normalization ───────────────────────────────────────────────────────

const OW_STATUS = {
  ready: "connected",
  qr_ready: "qr",
  initializing: "connecting",
  authenticating: "connecting",
  created: "connecting",
  disconnected: "disconnected",
  failed: "disconnected",
  action_required: "disconnected",
};

const MSG_TYPE = {
  text: "conversation",
  image: "imageMessage",
  video: "videoMessage",
  audio: "audioMessage",
  voice: "pttMessage",
  document: "documentMessage",
  sticker: "stickerMessage",
  location: "locationMessage",
  contact: "vcard",
  revoked: "protocolMessage",
  unknown: "unknown",
};

const DISPLAYABLE_TYPES = new Set([
  "conversation", "imageMessage", "videoMessage", "audioMessage",
  "pttMessage", "documentMessage", "documentWithCaptionMessage",
  "stickerMessage", "locationMessage", "vcard",
]);

function normalizeChatHistory(msg) {
  const type = MSG_TYPE[msg.type] ?? msg.type ?? "unknown";

  let text = msg.body ?? "";
  if (!text && msg.media?.filename) text = msg.media.filename;

  // Descarta mensagens sem conteúdo exibível (reações, status, revogadas, etc.)
  if (!text && !DISPLAYABLE_TYPES.has(type)) return null;

  const quoted = msg.quotedMessage
    ? { id: msg.quotedMessage.id, text: msg.quotedMessage.body ?? "" }
    : null;

  // wwebjs usa `from` como remetente; Baileys usa `author`
  const participant = msg.author ?? (msg.isGroup && !msg.fromMe ? msg.from : null);

  return {
    id: msg.id,
    jid: msg.chatId,
    fromMe: !!msg.fromMe,
    participant,
    timestamp: msg.timestamp ?? 0,
    text,
    type,
    status: null,
    quotedMessage: quoted,
  };
}

function normalizeChat(c) {
  return {
    jid: c.id,
    name: c.name || c.id,
    isGroup: c.isGroup ?? c.kind === "group",
    unreadCount: c.unreadCount ?? 0,
    lastMessage: c.lastMessage
      ? { text: c.lastMessage, type: "conversation", timestamp: c.timestamp ?? 0 }
      : null,
    timestamp: c.timestamp ?? 0,
  };
}

// ── Route handlers ─────────────────────────────────────────────────────────────

async function handleGetSessions() {
  try {
    const { json: sessions } = await owFetch("GET", "/sessions");
    const list = Array.isArray(sessions) ? sessions : [];
    return NextResponse.json(
      list.map((s) => ({
        id: s.id,
        status: OW_STATUS[s.status] ?? "disconnected",
        user: s.phone ? { id: s.phone, name: s.pushName || s.phone } : null,
      }))
    );
  } catch {
    return NextResponse.json([]);
  }
}

async function handleCreateSession() {
  try {
    const name = `account-${Date.now()}`;
    const { json: created } = await owFetch("POST", "/sessions", { name });
    if (!created?.id) return NextResponse.json({ error: "Falha ao criar sessão" }, { status: 500 });
    await owFetch("POST", `/sessions/${created.id}/start`).catch(() => {});
    return NextResponse.json({ id: created.id, status: "connecting" }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

async function handleStatus(sid) {
  try {
    const { json: sessions } = await owFetch("GET", "/sessions");
    const list = Array.isArray(sessions) ? sessions : [];
    if (list.length === 0) return NextResponse.json({ status: "disconnected", user: null });
    const session = sid
      ? (list.find((s) => s.id === sid) ?? null)
      : (list.find((s) => s.status === "ready") || list[0]);
    if (!session) return NextResponse.json({ status: "disconnected", user: null });
    const status = OW_STATUS[session.status] ?? "disconnected";
    const user = session.phone ? { id: session.phone, name: session.pushName || session.phone } : null;
    return NextResponse.json({ status, user });
  } catch {
    return NextResponse.json({ status: "disconnected", user: null });
  }
}

async function handleQR(sid) {
  const sessionId = await getSession(sid);
  if (!sessionId) return NextResponse.json({ error: "Sem sessão" }, { status: 503 });
  try {
    const { res, json } = await owFetch("GET", `/sessions/${sessionId}/qr`);
    if (!res.ok) return NextResponse.json({ error: "QR indisponível" }, { status: 404 });
    return NextResponse.json({ qr: json.qrCode });
  } catch {
    return NextResponse.json({ error: "Erro ao buscar QR" }, { status: 500 });
  }
}

async function handleChats(preferredSid) {
  const sid = await getSession(preferredSid);
  if (!sid) return NextResponse.json([]);
  try {
    const { json } = await owFetch("GET", `/sessions/${sid}/chats`);
    const list = Array.isArray(json) ? json : [];
    const SKIP = new Set(["status", "channel", "broadcast"]);
    const chats = list.filter((c) => !SKIP.has(c.kind)).map(normalizeChat);

    // Enriches chats that have no last message text, in batches to avoid overloading
    const needsEnrich = chats.filter((c) => !c.lastMessage?.text);
    const BATCH = 20;
    for (let i = 0; i < needsEnrich.length; i += BATCH) {
      await Promise.all(
        needsEnrich.slice(i, i + BATCH).map(async (chat) => {
          try {
            const { res, json: msgs } = await owFetch(
              "GET",
              `/sessions/${sid}/messages/${encodeURIComponent(chat.jid)}/history?limit=5`
            );
            if (!res.ok || !Array.isArray(msgs) || msgs.length === 0) return;
            // Sort newest first and pick the first displayable message
            const sorted = [...msgs].sort((a, b) => (b.timestamp ?? 0) - (a.timestamp ?? 0));
            for (const msg of sorted) {
              const normalized = normalizeChatHistory(msg);
              if (!normalized) continue;
              chat.lastMessage = {
                text: normalized.text,
                type: normalized.type,
                timestamp: normalized.timestamp,
              };
              break;
            }
          } catch {}
        })
      );
    }

    return NextResponse.json(chats);
  } catch {
    return NextResponse.json([]);
  }
}

async function handlePicture(jid, preferredSid) {
  const sid = await getSession(preferredSid);
  if (!sid) return new Response(null, { status: 404 });
  try {
    const { res, json } = await owFetch(
      "GET",
      `/sessions/${sid}/contacts/${encodeURIComponent(jid)}/profile-picture`
    );
    if (!res.ok || !json?.url) return new Response(null, { status: 404 });

    // Busca a imagem externamente e repassa como binário
    const img = await fetch(json.url, { signal: AbortSignal.timeout(8000) });
    if (!img.ok) return new Response(null, { status: 404 });
    const buf = await img.arrayBuffer();
    return new Response(buf, {
      status: 200,
      headers: {
        "Content-Type": img.headers.get("content-type") || "image/jpeg",
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=86400",
      },
    });
  } catch {
    return new Response(null, { status: 404 });
  }
}

async function handleMessages(jid, searchParams, preferredSid) {
  const sid = await getSession(preferredSid);
  if (!sid) return NextResponse.json([]);
  const limit = Math.min(parseInt(searchParams.get("limit") || "100", 10), 200);
  try {
    const { res, json } = await owFetch(
      "GET",
      `/sessions/${sid}/messages/${encodeURIComponent(jid)}/history?limit=${limit}`
    );
    if (!res.ok) return NextResponse.json([]);
    const list = Array.isArray(json) ? json : [];
    return NextResponse.json(
      list
        .map(normalizeChatHistory)
        .filter(Boolean)
        .sort((a, b) => a.timestamp - b.timestamp)
    );
  } catch {
    return NextResponse.json([]);
  }
}

async function handleSendText(jid, body, preferredSid) {
  const sid = await getSession(preferredSid);
  if (!sid) return NextResponse.json({ error: "Sem sessão" }, { status: 503 });
  try {
    const payload = { chatId: jid, text: body.text };
    if (body.quotedMessageId) payload.quotedMessageId = body.quotedMessageId;
    const { res, json } = await owFetch(
      "POST",
      `/sessions/${sid}/messages/send-text`,
      payload
    );
    if (!res.ok) return NextResponse.json({ error: json?.message || "Erro" }, { status: res.status });
    return NextResponse.json({ ok: true, id: json.messageId }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

const MEDIA_ENDPOINT = {
  image: "send-image",
  video: "send-video",
  audio: "send-audio",
  voice: "send-audio",
  document: "send-document",
  sticker: "send-sticker",
};

async function handleSendMedia(jid, body, preferredSid) {
  const sid = await getSession(preferredSid);
  if (!sid) return NextResponse.json({ error: "Sem sessão" }, { status: 503 });
  const endpoint = MEDIA_ENDPOINT[body.type];
  if (!endpoint) {
    return NextResponse.json({ error: `Tipo inválido: ${body.type}` }, { status: 400 });
  }
  try {
    const payload = {
      chatId: jid,
      base64: body.base64,
      mimetype: body.mimetype,
    };
    if (body.filename) payload.filename = body.filename;
    if (body.caption) payload.caption = body.caption;
    if (body.quotedMessageId) payload.quotedMessageId = body.quotedMessageId;
    const { res, json } = await owFetch(
      "POST",
      `/sessions/${sid}/messages/${endpoint}`,
      payload
    );
    if (!res.ok) return NextResponse.json({ error: json?.message || "Erro" }, { status: res.status });
    return NextResponse.json({ ok: true, id: json.messageId }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

async function handleMediaDownload(jid, msgId, preferredSid) {
  const sid = await getSession(preferredSid);
  if (!sid) return new Response(null, { status: 503 });
  try {
    const raw = await owFetchRaw(
      "GET",
      `/sessions/${sid}/messages/${encodeURIComponent(jid)}/${encodeURIComponent(msgId)}/media`
    );
    if (!raw.ok) return new Response(null, { status: raw.status });
    const buf = await raw.arrayBuffer();
    const ct = raw.headers.get("content-type") || "application/octet-stream";
    const cd = raw.headers.get("content-disposition") || "";
    return new Response(buf, {
      status: 200,
      headers: {
        "Content-Type": ct,
        "Content-Disposition": cd || "inline",
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch {
    return new Response(null, { status: 500 });
  }
}

async function handleRead(jid, preferredSid) {
  const sid = await getSession(preferredSid);
  if (!sid) return NextResponse.json({ ok: false }, { status: 503 });
  try {
    await owFetch("POST", `/sessions/${sid}/chats/read`, { chatId: jid });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}

async function handleLogout(sid) {
  const sessionId = sid || await getSession();
  if (!sid) invalidateSession(); // só invalida cache global quando logout sem sid específico
  if (!sessionId) return NextResponse.json({ ok: true });
  try {
    await owFetch("POST", `/sessions/${sessionId}/logout`);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true });
  }
}

// ── Main dispatcher ────────────────────────────────────────────────────────────

async function adapter(request, paramsPromise) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { path } = await paramsPromise;
  const segments = Array.isArray(path) ? path : [path];
  const [p0, p1raw, p2, p3, p4] = segments;
  const p1 = p1raw ? decodeURIComponent(p1raw) : undefined;
  const method = request.method;
  const { searchParams } = new URL(request.url);

  let body = {};
  if (method === "POST" || method === "PATCH") {
    try { body = await request.json(); } catch {}
  }

  const querySid = searchParams.get("sid") || null;

  // GET /sessions
  if (p0 === "sessions" && !p1 && method === "GET") return handleGetSessions();

  // POST /sessions
  if (p0 === "sessions" && !p1 && method === "POST") return handleCreateSession();

  // GET /status
  if (p0 === "status") return handleStatus(querySid);

  // GET /qr
  if (p0 === "qr") return handleQR(querySid);

  // DELETE /logout
  if (p0 === "logout" && method === "DELETE") return handleLogout(querySid);

  // /chats/*
  if (p0 === "chats") {
    // GET /chats
    if (!p1 && method === "GET") return handleChats(querySid);

    const jid = p1;

    // GET /chats/:jid/picture
    if (p2 === "picture") return handlePicture(jid, querySid);

    // POST /chats/:jid/read
    if (p2 === "read" && method === "POST") return handleRead(jid, querySid);

    // /chats/:jid/messages/*
    if (p2 === "messages") {
      // GET /chats/:jid/messages?limit=N
      if (!p3 && method === "GET") return handleMessages(jid, searchParams, querySid);

      // POST /chats/:jid/messages  → enviar texto
      if (!p3 && method === "POST") return handleSendText(jid, body, querySid);

      // POST /chats/:jid/messages/media → enviar mídia
      if (p3 === "media" && method === "POST") return handleSendMedia(jid, body, querySid);

      // GET /chats/:jid/messages/:msgId/media → download mídia
      if (p3 && p4 === "media" && method === "GET")
        return handleMediaDownload(jid, decodeURIComponent(p3), querySid);
    }
  }

  return NextResponse.json({ error: "Not Found" }, { status: 404 });
}

export const GET    = (req, ctx) => adapter(req, ctx.params);
export const POST   = (req, ctx) => adapter(req, ctx.params);
export const DELETE = (req, ctx) => adapter(req, ctx.params);
export const PATCH  = (req, ctx) => adapter(req, ctx.params);
