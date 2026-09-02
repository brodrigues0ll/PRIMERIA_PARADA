import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  isJidGroup,
  isJidBroadcast,
  jidNormalizedUser,
} from '@whiskeysockets/baileys'
import { Boom } from '@hapi/boom'
import pino from 'pino'
import qrcode from 'qrcode'
import { EventEmitter } from 'events'
import { rmSync, readFileSync, writeFileSync, existsSync } from 'fs'

export const emitter = new EventEmitter()

// ── Store ─────────────────────────────────────────────────────────────────────
const STORE_PATH = './store.json'

const chats    = new Map() // jid → Chat
const messages = new Map() // jid → WAMessage[]
const contacts = new Map() // jid → Contact

function loadStore() {
  if (!existsSync(STORE_PATH)) return
  try {
    const { chats: c, messages: m, contacts: ct } = JSON.parse(readFileSync(STORE_PATH, 'utf8'))
    for (const [k, v] of c)  chats.set(k, v)
    for (const [k, v] of m)  messages.set(k, v)
    for (const [k, v] of ct) contacts.set(k, v)
    console.log(`[store] carregado: ${chats.size} chats, ${messages.size} conversas`)
  } catch (e) {
    console.error('[store] erro ao carregar:', e.message)
  }
}

function saveStore() {
  try {
    writeFileSync(STORE_PATH, JSON.stringify({
      chats:    [...chats.entries()],
      messages: [...messages.entries()],
      contacts: [...contacts.entries()],
    }))
  } catch (e) {
    console.error('[store] erro ao salvar:', e.message)
  }
}

loadStore()

let sock            = null
let currentQR       = null
let connectionState = 'disconnected'
let connectedUser   = null

// ── Helpers ───────────────────────────────────────────────────────────────────

function extractText(msg) {
  if (!msg?.message) return ''
  const m = msg.message
  return (
    m.conversation                    ||
    m.extendedTextMessage?.text       ||
    m.imageMessage?.caption           ||
    m.videoMessage?.caption           ||
    m.documentMessage?.fileName       ||
    (m.audioMessage    ? '[áudio]'    : null) ||
    (m.stickerMessage  ? '[sticker]'  : null) ||
    (m.locationMessage ? '[localização]' : null) ||
    (m.contactMessage  ? '[contato]'  : null) ||
    ''
  )
}

function extractType(msg) {
  if (!msg?.message) return 'unknown'
  return Object.keys(msg.message).find(k => k !== 'messageContextInfo') || 'unknown'
}

export function normalizeMessage(msg) {
  return {
    id:          msg.key.id,
    jid:         msg.key.remoteJid,
    fromMe:      !!msg.key.fromMe,
    participant: msg.key.participant || null,
    timestamp:   Number(msg.messageTimestamp) || 0,
    text:        extractText(msg),
    type:        extractType(msg),
    status:      msg.status ?? null,
  }
}

export function normalizeJidParam(raw) {
  const jid = decodeURIComponent(raw)
  if (jid.includes('@')) return jid
  return `${jid}@s.whatsapp.net`
}

function contactName(jid) {
  const c = contacts.get(jid)
  return c?.name || c?.notify || jid.split('@')[0]
}

// ── Store helpers ─────────────────────────────────────────────────────────────

function pushMessage(jid, msg) {
  if (!messages.has(jid)) messages.set(jid, [])
  const list = messages.get(jid)
  const idx  = list.findIndex(m => m.key?.id === msg.key?.id)
  if (idx === -1) list.push(msg)
  else list[idx] = { ...list[idx], ...msg }
}

function touchChat(msg) {
  const jid     = msg.key.remoteJid
  const current = chats.get(jid) || { id: jid, unreadCount: 0 }
  chats.set(jid, {
    ...current,
    lastMessage: normalizeMessage(msg),
    timestamp:   Number(msg.messageTimestamp) || current.timestamp || 0,
  })
}

// ── Leitura pública ───────────────────────────────────────────────────────────

export function getChats() {
  return Array.from(chats.values())
    .filter(c => !isJidBroadcast(c.id))
    .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
    .map(c => ({
      jid:          c.id,
      name:         c.name || contactName(c.id),
      isGroup:      isJidGroup(c.id),
      unreadCount:  c.unreadCount || 0,
      lastMessage:  c.lastMessage || null,
      timestamp:    c.timestamp || 0,
    }))
}

export function getChatMessages(jid, limit = 50) {
  return (messages.get(jid) || []).slice(-limit).map(normalizeMessage)
}

// ── Status / QR ───────────────────────────────────────────────────────────────

export function getStatus() {
  return { status: connectionState, user: connectedUser, hasQR: !!currentQR }
}

export async function getQR() {
  if (!currentQR) return null
  return qrcode.toDataURL(currentQR)
}

export async function getQRBuffer() {
  if (!currentQR) return null
  return qrcode.toBuffer(currentQR, { type: 'png', width: 300, margin: 2 })
}

// ── Ações ─────────────────────────────────────────────────────────────────────

export async function sendText(jid, text) {
  if (connectionState !== 'connected') throw new Error('WhatsApp não conectado')
  return sock.sendMessage(jid, { text })
}

export async function markAsRead(jid) {
  if (connectionState !== 'connected') throw new Error('WhatsApp não conectado')
  const last = (messages.get(jid) || []).at(-1)
  if (last) await sock.readMessages([last.key])
}

export async function getProfilePictureUrl(jid) {
  if (connectionState !== 'connected' || !sock) return null
  try {
    return await sock.profilePictureUrl(jid, 'image')
  } catch {
    return null
  }
}

export { saveStore }

export async function logout() {
  if (sock) await sock.logout()
  rmSync('./auth', { recursive: true, force: true })
  setTimeout(connect, 1000)
}

// ── Conexão ───────────────────────────────────────────────────────────────────

async function connect() {
  const { state, saveCreds } = await useMultiFileAuthState('./auth')
  const { version }          = await fetchLatestBaileysVersion()

  sock = makeWASocket({
    version,
    logger: pino({ level: 'silent' }),
    auth:   state,
    printQRInTerminal: true,
    browser: ['WhatsApp API', 'Chrome', '120.0.0'],
    getMessage: async (key) => {
      const list = messages.get(key.remoteJid) || []
      return list.find(m => m.key?.id === key.id)?.message
    },
  })

  sock.ev.on('creds.update', saveCreds)

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update

    if (qr) {
      currentQR       = qr
      connectionState = 'qr'
      const dataURL   = await qrcode.toDataURL(qr)
      emitter.emit('qr', { qr: dataURL })
    }

    if (connection === 'connecting') {
      connectionState = 'connecting'
      emitter.emit('connection', { status: 'connecting' })
    }

    if (connection === 'open') {
      currentQR       = null
      connectionState = 'connected'
      connectedUser   = sock.user
        ? { id: jidNormalizedUser(sock.user.id), name: sock.user.name }
        : null
      emitter.emit('connection', { status: 'connected', user: connectedUser })
    }

    if (connection === 'close') {
      connectionState = 'disconnected'
      connectedUser   = null
      const code      = new Boom(lastDisconnect?.error)?.output?.statusCode
      const loggedOut = code === DisconnectReason.loggedOut
      emitter.emit('connection', { status: 'disconnected', loggedOut })
      setTimeout(connect, 3000)
    }
  })

  // Histórico inicial (sync após login/reconexão)
  sock.ev.on('messaging-history.set', ({ chats: cl, contacts: ctl, messages: ml }) => {
    console.log(`[history] chats=${cl.length} contacts=${ctl.length} messages=${ml.length}`)
    for (const c of ctl) contacts.set(c.id, c)
    for (const c of cl)   chats.set(c.id, { ...chats.get(c.id), ...c })
    for (const m of ml) {
      const jid = m.key?.remoteJid
      if (jid) pushMessage(jid, m)
    }
    saveStore()
  })

  sock.ev.on('contacts.upsert', (list) => {
    for (const c of list) contacts.set(c.id, { ...contacts.get(c.id), ...c })
  })

  sock.ev.on('chats.upsert', (list) => {
    for (const c of list) chats.set(c.id, { ...chats.get(c.id), ...c })
  })

  sock.ev.on('chats.update', (list) => {
    for (const u of list) {
      if (chats.has(u.id)) chats.set(u.id, { ...chats.get(u.id), ...u })
    }
  })

  sock.ev.on('messages.upsert', ({ messages: list, type }) => {
    for (const msg of list) {
      const jid = msg.key.remoteJid
      if (!jid) continue
      pushMessage(jid, msg)
      touchChat(msg)
      if (type === 'notify') emitter.emit('message', normalizeMessage(msg))
    }
    saveStore()
  })

  sock.ev.on('messages.update', (list) => {
    for (const u of list) {
      // atualiza status no store local
      const msgs = messages.get(u.key.remoteJid)
      if (msgs) {
        const idx = msgs.findIndex(m => m.key?.id === u.key.id)
        if (idx !== -1) msgs[idx] = { ...msgs[idx], ...u.update }
      }
      emitter.emit('message_update', {
        id:     u.key.id,
        jid:    u.key.remoteJid,
        status: u.update?.status,
      })
    }
  })
}

export { connect }
