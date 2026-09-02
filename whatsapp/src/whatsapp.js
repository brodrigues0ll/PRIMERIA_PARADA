import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  isJidGroup,
  isJidBroadcast,
  jidNormalizedUser,
  downloadMediaMessage,
} from '@whiskeysockets/baileys'
import { Boom } from '@hapi/boom'
import pino from 'pino'
import qrcode from 'qrcode'
import { EventEmitter } from 'events'
import { rmSync, readdirSync, readFileSync, writeFileSync, renameSync, existsSync } from 'fs'
import { join } from 'path'

export const emitter = new EventEmitter()

// ── Long helper ───────────────────────────────────────────────────────────────
// Converte timestamps do protobufjs (Long ou string ou number) para number JS
function toLong(val) {
  if (!val) return 0
  if (typeof val === 'number') return val
  if (typeof val === 'bigint') return Number(val)
  if (typeof val === 'string') return parseInt(val, 10) || 0
  // protobufjs Long: { low: int32, high: int32, unsigned: bool }
  if (val.low !== undefined && val.high !== undefined) {
    return (val.high >>> 0) * 4294967296 + (val.low >>> 0)
  }
  return Number(val) || 0
}

// ── Store ─────────────────────────────────────────────────────────────────────
const STORE_PATH = './store.json'

const chats    = new Map() // jid → Chat
const messages = new Map() // jid → WAMessage[]
const contacts = new Map() // jid → Contact
const lidMap   = new Map() // @lid → @s.whatsapp.net

function loadStore() {
  if (!existsSync(STORE_PATH)) return
  try {
    const { chats: c, messages: m, contacts: ct } = JSON.parse(readFileSync(STORE_PATH, 'utf8'))
    // Carrega contatos primeiro para popular lidMap antes de resolver mensagens
    for (const [, v] of ct) registerContact(v)
    // Migra chats: chaves @lid → @s.whatsapp.net
    for (const [k, v] of c) {
      const rk = resolveLid(k)
      chats.set(rk, { ...v, id: rk })
    }
    // Migra mensagens: chaves @lid → @s.whatsapp.net
    for (const [k, v] of m)  messages.set(resolveLid(k), v)

    // Corrige chats cujo timestamp é um Long protobuf e popula lastMessage a partir das msgs
    for (const [jid, chat] of chats) {
      const chatTs = toLong(chat.conversationTimestamp || chat.timestamp) || 0
      const existingLastTs = toLong(chat.lastMessage?.timestamp) || 0

      const msgs = messages.get(jid) || []
      let latestMsg = null
      let latestTs  = existingLastTs

      for (const m of msgs) {
        const ts = toLong(m.messageTimestamp)
        if (ts > latestTs) { latestTs = ts; latestMsg = m }
      }

      const newTs = Math.max(chatTs, latestTs)
      if (latestMsg || newTs !== (chat.timestamp || 0)) {
        chats.set(jid, {
          ...chat,
          timestamp:   newTs,
          lastMessage: latestMsg ? normalizeMessage(latestMsg) : (chat.lastMessage || null),
        })
      }
    }

    console.log(`[store] carregado: ${chats.size} chats, ${messages.size} conversas`)
  } catch (e) {
    console.error('[store] erro ao carregar:', e.message)
  }
}

function saveStore() {
  const payload = JSON.stringify({
    chats:    [...chats.entries()],
    messages: [...messages.entries()],
    contacts: [...contacts.entries()],
  })
  const tmp = STORE_PATH + '.tmp'
  try {
    writeFileSync(tmp, payload)
    renameSync(tmp, STORE_PATH)
  } catch {
    // renameSync falha em bind mounts WSL2/Windows — fallback direto
    try { writeFileSync(STORE_PATH, payload) } catch (e) {
      console.error('[store] erro ao salvar:', e.message)
    }
  }
}

loadStore()

let sock            = null
let currentQR       = null
let connectionState = 'disconnected'
let connectedUser   = null
let reconnectTimer  = null   // timer de reconexão — cancelado quando a conexão abre

function scheduleReconnect(ms) {
  if (reconnectTimer) clearTimeout(reconnectTimer)
  reconnectTimer = setTimeout(() => { reconnectTimer = null; connect() }, ms)
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function extractText(msg) {
  if (!msg?.message) return ''
  const m = msg.message
  return (
    m.conversation                          ||
    m.extendedTextMessage?.text             ||
    m.imageMessage?.caption                 ||
    m.videoMessage?.caption                 ||
    m.documentMessage?.fileName             ||
    (m.imageMessage    ? '[imagem]'         : null) ||
    (m.videoMessage    ? '[vídeo]'          : null) ||
    (m.audioMessage    ? '[áudio]'          : null) ||
    (m.stickerMessage  ? '[sticker]'        : null) ||
    (m.documentMessage ? '[documento]'      : null) ||
    (m.locationMessage ? '[localização]'    : null) ||
    (m.contactMessage  ? '[contato]'        : null) ||
    (m.pollCreationMessage ? '[enquete]'    : null) ||
    (m.buttonsMessage  ? m.buttonsMessage.contentText || '[botões]' : null) ||
    (m.listMessage     ? m.listMessage.description    || '[lista]'  : null) ||
    ''
  )
}

function extractType(msg) {
  if (!msg?.message) return 'unknown'
  return Object.keys(msg.message).find(k => k !== 'messageContextInfo') || 'unknown'
}

function extractQuotedInfo(msg) {
  const content = msg.message
  if (!content) return null
  const ctxInfo =
    content?.extendedTextMessage?.contextInfo ||
    content?.imageMessage?.contextInfo ||
    content?.videoMessage?.contextInfo ||
    content?.audioMessage?.contextInfo ||
    content?.documentMessage?.contextInfo ||
    content?.stickerMessage?.contextInfo
  if (!ctxInfo?.stanzaId) return null
  const qm = ctxInfo.quotedMessage
  if (!qm) return null
  const text =
    qm.conversation ||
    qm.extendedTextMessage?.text ||
    qm.imageMessage?.caption ||
    qm.videoMessage?.caption ||
    qm.documentMessage?.fileName ||
    (qm.imageMessage    ? '[imagem]'    : null) ||
    (qm.videoMessage    ? '[vídeo]'     : null) ||
    (qm.audioMessage    ? '[áudio]'     : null) ||
    (qm.stickerMessage  ? '[sticker]'   : null) ||
    (qm.documentMessage ? '[documento]' : null) ||
    ''
  return { id: ctxInfo.stanzaId, participant: ctxInfo.participant || null, text }
}

export function normalizeMessage(msg) {
  return {
    id:            msg.key.id,
    jid:           resolveLid(msg.key.remoteJid),
    fromMe:        !!msg.key.fromMe,
    participant:   msg.key.participant || null,
    timestamp:     toLong(msg.messageTimestamp),
    text:          extractText(msg),
    type:          extractType(msg),
    status:        msg.status ?? null,
    quotedMessage: extractQuotedInfo(msg),
  }
}

export function normalizeJidParam(raw) {
  const jid = decodeURIComponent(raw)
  if (jid.includes('@')) return jid
  return `${jid}@s.whatsapp.net`
}

function formatPhone(jid) {
  const raw = jid.split('@')[0]
  if (!/^\d+$/.test(raw)) return raw
  // Número brasileiro: 55 + DDD (2) + número (8 ou 9 dígitos)
  if (raw.startsWith('55') && (raw.length === 12 || raw.length === 13)) {
    const ddd  = raw.slice(2, 4)
    const rest = raw.slice(4)
    const part = rest.length === 9
      ? `${rest.slice(0, 5)}-${rest.slice(5)}`
      : `${rest.slice(0, 4)}-${rest.slice(4)}`
    return `+55 (${ddd}) ${part}`
  }
  return `+${raw}`
}

// Extrai a parte numérica de um JID ou número formatado ("628:2@s.whatsapp.net" → "628")
function userPart(jid) {
  if (!jid) return ''
  // Remove sufixo @domínio e :device
  return jid.split('@')[0].split(':')[0].replace(/\D/g, '')
}

function resolveLid(jid) {
  if (!jid?.endsWith('@lid')) return jid
  return lidMap.get(jid) || jid
}

// Aprende mapeamentos lid→pn a partir dos campos Alt do key Baileys v7
// (remoteJidAlt / participantAlt são o dialeto oposto do mesmo campo)
function recordKeyLidMappings(key) {
  const pairs = [
    { a: key.remoteJid,  b: key.remoteJidAlt  },
    { a: key.participant, b: key.participantAlt },
  ]
  for (const { a, b } of pairs) {
    if (!a || !b) continue
    let lid, pn
    if (a.endsWith('@lid')) { lid = a; pn = b }
    else if (b.endsWith('@lid')) { lid = b; pn = a }
    else continue
    if (lid && pn && !lidMap.has(lid)) {
      lidMap.set(lid, pn)
      console.log(`[lid] aprendeu ${lid} → ${pn}`)
    }
  }
}

function registerContact(c) {
  contacts.set(c.id, { ...contacts.get(c.id), ...c })
  // Constrói mapa @lid → @s.whatsapp.net a partir do campo lid do contato
  if (c.lid && c.id && !c.id.endsWith('@lid')) {
    lidMap.set(c.lid, c.id)
  }
  // Contato salvo como @lid com phoneNumber: extrai só os dígitos (phoneNumber pode ser JID)
  if (c.id?.endsWith('@lid') && c.phoneNumber) {
    const digits = userPart(c.phoneNumber)
    if (digits) lidMap.set(c.id, `${digits}@s.whatsapp.net`)
  }
}

function findContact(jid) {
  if (contacts.has(jid)) return contacts.get(jid)
  // Busca reversa: algum @lid no lidMap que aponte para este jid?
  for (const [lid, real] of lidMap) {
    if (real === jid && contacts.has(lid)) return contacts.get(lid)
  }
  return null
}

function contactName(jid) {
  const resolved = resolveLid(jid)
  const c = findContact(resolved) || findContact(jid)
  return c?.name || c?.verifiedName || c?.notify || formatPhone(resolved)
}

// ── Store helpers ─────────────────────────────────────────────────────────────

function pushMessage(jid, msg) {
  const key = resolveLid(jid)
  if (!messages.has(key)) messages.set(key, [])
  const list = messages.get(key)
  const idx  = list.findIndex(m => m.key?.id === msg.key?.id)
  if (idx === -1) list.push(msg)
  else list[idx] = { ...list[idx], ...msg }
}

function touchChat(msg) {
  const jid     = resolveLid(msg.key.remoteJid)
  // Usa a chave já existente no Map (evita duplicar entrada @lid + real)
  const chatKey = chats.has(jid) ? jid : (chats.has(msg.key.remoteJid) ? msg.key.remoteJid : jid)
  const current = chats.get(chatKey) || { id: jid, unreadCount: 0 }
  const ts      = toLong(msg.messageTimestamp)
  chats.set(chatKey, {
    ...current,
    id:          jid,
    lastMessage: normalizeMessage(msg),
    timestamp:   Math.max(ts, toLong(current.timestamp)),
  })
}

// ── Leitura pública ───────────────────────────────────────────────────────────

export function getChats() {
  const seen = new Set()
  return Array.from(chats.values())
    .filter(c => !isJidBroadcast(c.id) && !c.id.endsWith('@newsletter'))
    .map(c => {
      // Resolve chats salvos com @lid para o JID real
      const resolvedId = resolveLid(c.id)
      // Se @lid não foi resolvido, descarta
      if (resolvedId.endsWith('@lid')) return null
      // Evita duplicatas (pode ter o mesmo contato salvo como @lid e @s.whatsapp.net)
      if (seen.has(resolvedId)) return null
      seen.add(resolvedId)

      const contact = findContact(resolvedId) || findContact(c.id)
      const name = isJidGroup(resolvedId)
        ? (c.name || contact?.name)
        : (contact?.name || contact?.verifiedName || c.name || contact?.notify || formatPhone(resolvedId))
      return {
        jid:         resolvedId,
        name,
        isGroup:     isJidGroup(resolvedId),
        unreadCount: c.unreadCount || 0,
        lastMessage: c.lastMessage || null,
        timestamp:   c.timestamp || 0,
      }
    })
    .filter(Boolean)
    .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
}

export function getChatMessages(jid, limit = 50) {
  const list = messages.get(jid) || []
  return list
    .slice()
    .sort((a, b) => toLong(a.messageTimestamp) - toLong(b.messageTimestamp))
    .slice(-limit)
    .map(normalizeMessage)
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

export async function sendText(jid, text, quotedMessageId = null) {
  if (connectionState !== 'connected') throw new Error('WhatsApp não conectado')
  const opts = {}
  if (quotedMessageId) {
    const raw = getRawMessage(resolveLid(jid), quotedMessageId)
    if (raw) opts.quoted = raw
  }
  const result = await sock.sendMessage(jid, { text }, opts)
  // Garante que o chat é atualizado no store mesmo que messages.upsert dispare tarde
  if (result?.key) {
    const fakeMsg = {
      key: result.key,
      message: { conversation: text },
      messageTimestamp: Math.floor(Date.now() / 1000),
      status: 1,
    }
    pushMessage(resolveLid(jid), fakeMsg)
    touchChat(fakeMsg)
    saveStore()
  }
  return result
}

export async function sendMedia(jid, { type, buffer, mimetype, filename, caption, quotedMessageId }) {
  if (connectionState !== 'connected') throw new Error('WhatsApp não conectado')
  const VALID = ['image', 'video', 'audio', 'voice', 'document', 'sticker']
  if (!VALID.includes(type)) throw new Error(`Tipo de mídia inválido: ${type}`)

  let content = {}
  switch (type) {
    case 'image':
      content = { image: buffer, mimetype, caption: caption || '' }
      break
    case 'video':
      content = { video: buffer, mimetype, caption: caption || '' }
      break
    case 'audio':
      content = { audio: buffer, mimetype, ptt: false }
      break
    case 'voice':
      content = { audio: buffer, mimetype, ptt: true }
      break
    case 'document':
      content = { document: buffer, mimetype, fileName: filename || 'arquivo', caption: caption || '' }
      break
    case 'sticker':
      content = { sticker: buffer }
      break
  }

  const opts = {}
  if (quotedMessageId) {
    const raw = getRawMessage(resolveLid(jid), quotedMessageId)
    if (raw) opts.quoted = raw
  }

  const result = await sock.sendMessage(jid, content, opts)
  if (result?.key) {
    const fakeMsg = {
      key: result.key,
      message: result.message || {},
      messageTimestamp: Math.floor(Date.now() / 1000),
      status: 1,
    }
    pushMessage(resolveLid(jid), fakeMsg)
    touchChat(fakeMsg)
    saveStore()
  }
  return result
}

export async function markAsRead(jid) {
  if (connectionState !== 'connected') throw new Error('WhatsApp não conectado')
  const resolved = resolveLid(jid)
  const list = messages.get(resolved) || []
  const last = list.at(-1)
  if (last) await sock.readMessages([last.key])
  // Busca o chat pela chave resolvida ou pela chave original (compatibilidade)
  const chatKey = chats.has(resolved) ? resolved : (chats.has(jid) ? jid : resolved)
  const current = chats.get(chatKey)
  if (current && current.unreadCount) {
    chats.set(chatKey, { ...current, unreadCount: 0 })
    saveStore()
  }
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

export function getRawMessage(jid, msgId) {
  // Busca direta pelo JID resolvido
  let list = messages.get(jid) || []
  let msg  = list.find(m => m.key?.id === msgId)
  if (msg) return msg

  // Fallback: procura em todas as listas (mensagens antigas podem ter chave diferente)
  for (const [, msgs] of messages) {
    msg = msgs.find(m => m.key?.id === msgId)
    if (msg) return msg
  }
  return null
}

export async function downloadMedia(jid, msgId) {
  const msg = getRawMessage(jid, msgId)
  if (!msg) throw new Error('Mensagem não encontrada')
  const m = msg.message
  if (!m) throw new Error('Mensagem sem conteúdo')

  const type = Object.keys(m).find(k =>
    ['imageMessage', 'videoMessage', 'audioMessage', 'stickerMessage', 'documentMessage'].includes(k)
  )
  if (!type) throw new Error('Mensagem sem mídia')

  const buffer = await downloadMediaMessage(
    msg,
    'buffer',
    {},
    { logger: pino({ level: 'silent' }), reuploadRequest: sock?.updateMediaMessage }
  )

  const mime = m[type]?.mimetype || 'application/octet-stream'
  return { buffer, mime, type }
}

export async function logout() {
  // Desconecta do WA (ignora erros se já estiver desconectado)
  try { if (sock) await sock.logout() } catch {}
  try { if (sock) sock.end() } catch {}
  sock = null

  // Limpa conteúdo de auth/ sem remover o diretório (preserva o bind mount do Docker)
  try {
    for (const f of readdirSync('./auth'))
      rmSync(join('./auth', f), { recursive: true, force: true })
  } catch {}

  // Limpa store em memória
  chats.clear()
  messages.clear()
  contacts.clear()
  connectionState = 'disconnected'
  connectedUser   = null
  currentQR       = null

  scheduleReconnect(800)
}

// ── Conexão ───────────────────────────────────────────────────────────────────

async function connect() {
  console.log('[connect] iniciando...')
  const { state, saveCreds } = await useMultiFileAuthState('./auth')
  console.log('[connect] auth carregada, buscando versão WA...')
  const { version }          = await fetchLatestBaileysVersion()
  console.log('[connect] versão WA:', version)

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
      if (reconnectTimer) { clearTimeout(reconnectTimer); reconnectTimer = null }
      currentQR       = null
      connectionState = 'connected'
      console.log(`[connection] open user=${sock.user?.id}`)
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
      console.log(`[connection] close code=${code} loggedOut=${loggedOut}`)
      emitter.emit('connection', { status: 'disconnected', loggedOut })
      if (loggedOut) {
        // Limpa auth para gerar novo QR na próxima conexão
        try {
          for (const f of readdirSync('./auth'))
            rmSync(join('./auth', f), { recursive: true, force: true })
        } catch {}
        scheduleReconnect(1000)
      } else {
        scheduleReconnect(3000)
      }
    }
  })

  // Histórico inicial (sync após login/reconexão)
  sock.ev.on('messaging-history.set', ({ chats: cl, contacts: ctl, messages: ml }) => {
    console.log(`[history] chats=${cl.length} contacts=${ctl.length} messages=${ml.length}`)
    for (const c of ctl) registerContact(c)
    for (const c of cl) {
      const jid      = resolveLid(c.id)
      const existing = chats.get(jid)
      const chatTs   = toLong(c.conversationTimestamp || c.timestamp)
      const existTs  = toLong(existing?.timestamp)
      chats.set(jid, {
        ...existing,
        ...c,
        id:        jid,
        timestamp: Math.max(existTs, chatTs),
      })
    }

    // Rastreia a mensagem mais recente por JID em O(n)
    const latestPerJid = new Map()
    for (const m of ml) {
      const jid = m.key?.remoteJid
      if (!jid) continue
      recordKeyLidMappings(m.key)  // aprende lid→pn a partir do Alt Baileys v7
      pushMessage(jid, m)
      const ts  = toLong(m.messageTimestamp)
      const cur = latestPerJid.get(jid)
      if (!cur || ts > toLong(cur.messageTimestamp)) latestPerJid.set(jid, m)
    }

    // Popula lastMessage e timestamp nos chats a partir do histórico
    for (const [jid, m] of latestPerJid) {
      const chat = chats.get(jid)
      if (!chat) continue
      const incoming = toLong(m.messageTimestamp)
      const existing = toLong(chat.lastMessage?.timestamp)
      if (incoming > existing) {
        chats.set(jid, {
          ...chat,
          lastMessage: normalizeMessage(m),
          timestamp:   Math.max(toLong(chat.timestamp), incoming),
        })
      }
    }

    saveStore()
  })

  let contactsSaveTimer = null
  sock.ev.on('contacts.upsert', (list) => {
    for (const c of list) registerContact(c)
    clearTimeout(contactsSaveTimer)
    contactsSaveTimer = setTimeout(saveStore, 3000)
  })

  sock.ev.on('chats.upsert', (list) => {
    for (const c of list) {
      const jid = resolveLid(c.id)
      chats.set(jid, { ...chats.get(jid), ...c, id: jid })
    }
  })

  sock.ev.on('chats.update', (list) => {
    for (const u of list) {
      const jid = resolveLid(u.id)
      const key = chats.has(jid) ? jid : (chats.has(u.id) ? u.id : jid)
      chats.set(key, { ...chats.get(key), ...u, id: jid })
    }
  })

  // Tipos de mensagem interna do WhatsApp — nunca exibir no chat
  const SKIP_TYPES = new Set([
    'protocolMessage',
    'senderKeyDistributionMessage',
    'messageContextInfo',
    'reactionMessage',
  ])

  sock.ev.on('messages.upsert', ({ messages: list, type }) => {
    for (const msg of list) {
      const jid = msg.key.remoteJid
      if (!jid) continue
      recordKeyLidMappings(msg.key)  // aprende lid→pn a partir do Alt Baileys v7
      pushMessage(jid, msg)
      touchChat(msg)
      if (type === 'notify') {
        const msgType = extractType(msg)
        if (SKIP_TYPES.has(msgType)) continue
        const norm = normalizeMessage(msg)
        console.log(`[upsert] emit fromMe=${norm.fromMe} type=${msgType} text="${norm.text?.slice(0,40)}"`)
        emitter.emit('message', norm)
      }
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
