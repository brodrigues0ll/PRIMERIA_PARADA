import 'dotenv/config'
import express from 'express'
import { createServer } from 'http'
import { Server } from 'socket.io'
import cors from 'cors'
import { apiReference } from '@scalar/express-api-reference'
import { connect, emitter, getChats, getChatMessages, saveStore } from './whatsapp.js'
import { spec } from './openapi.js'
import authRouter     from './routes/auth.js'
import chatsRouter    from './routes/chats.js'
import messagesRouter from './routes/messages.js'
import eventsRouter   from './routes/events.js'

const app        = express()
const httpServer = createServer(app)
const io         = new Server(httpServer, { cors: { origin: '*' } })

const PORT    = process.env.PORT    || 3000
const API_KEY = process.env.WA_API_KEY || process.env.API_KEY || null

// ── Middleware ────────────────────────────────────────────────────────────────

app.use(cors())
app.use(express.json({ limit: '50mb' }))

if (API_KEY) {
  app.use('/api', (req, res, next) => {
    const key = req.headers['x-api-key'] || req.query.api_key
    if (key !== API_KEY) return res.status(401).json({ error: 'Unauthorized' })
    next()
  })
}

// ── Rotas ─────────────────────────────────────────────────────────────────────

app.use('/api',        authRouter)
app.use('/api',        eventsRouter)
app.use('/api/chats',  chatsRouter)
app.use('/api/chats',  messagesRouter)

// GET /api/test/latest → HTML com as últimas 10 msgs da conversa mais recente (sem auth)
app.get('/api/test/latest', (_req, res) => {
  const SKIP = new Set(['protocolMessage', 'senderKeyDistributionMessage', 'unknown'])

  const chats = getChats()
  const chat  = chats.find(c => {
    const msgs = getChatMessages(c.jid, 100).filter(m => !SKIP.has(m.type))
    return msgs.length > 0
  })

  if (!chat) return res.status(404).send(`<!DOCTYPE html>
<html lang="pt-BR"><head><meta charset="utf-8"><title>WhatsApp Test</title>
<style>body{font-family:sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#f0f2f5;color:#999}</style>
</head><body><p>⏳ Aguardando sincronização do histórico…</p></body></html>`)

  const messages = getChatMessages(chat.jid, 100)
    .filter(m => !SKIP.has(m.type))
    .slice(-10)
  const initials = chat.name.slice(0, 2).toUpperCase()

  const bubbles = messages.map(m => {
    const side  = m.fromMe ? 'me' : 'them'
    const time  = new Date(m.timestamp * 1000).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    const label = m.fromMe ? 'Você' : chat.name
    return `<div class="bubble ${side}">
      <span class="label">${label}</span>
      <p>${m.text || `<em>[${m.type}]</em>`}</p>
      <span class="time">${time}</span>
    </div>`
  }).join('')

  res.setHeader('Cache-Control', 'no-store')
  res.send(`<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<title>WhatsApp Test — ${chat.name}</title>
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0 }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #efeae2; min-height: 100vh; display: flex; flex-direction: column }
  header { background: #128c7e; color: #fff; padding: 12px 16px; display: flex; align-items: center; gap: 12px; position: sticky; top: 0; z-index: 10; box-shadow: 0 1px 4px rgba(0,0,0,.2) }
  .avatar { width: 40px; height: 40px; border-radius: 50%; background: #075e54; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 14px; flex-shrink: 0 }
  .chat-info small { opacity: .8; font-size: 12px; display: block }
  .messages { flex: 1; padding: 16px; display: flex; flex-direction: column; gap: 6px; max-width: 720px; width: 100%; margin: 0 auto }
  .bubble { max-width: 70%; padding: 8px 12px 4px; border-radius: 8px; font-size: 14px; line-height: 1.4; position: relative }
  .bubble.them { background: #fff; border-top-left-radius: 0; align-self: flex-start }
  .bubble.me   { background: #d9fdd3; border-top-right-radius: 0; align-self: flex-end }
  .bubble .label { font-size: 11px; font-weight: 600; color: #128c7e; display: block; margin-bottom: 2px }
  .bubble.me .label { color: #075e54 }
  .bubble p { color: #111; word-break: break-word }
  .bubble .time { font-size: 10px; color: #999; display: block; text-align: right; margin-top: 4px }
  footer { text-align: center; padding: 8px; font-size: 11px; color: #999 }
</style>
</head>
<body>
  <header>
    <div class="avatar">${initials}</div>
    <div class="chat-info">
      <strong>${chat.name}</strong>
      <small>${chat.isGroup ? 'Grupo' : 'Contato'} · ${chat.jid}</small>
    </div>
  </header>
  <div class="messages">${bubbles}</div>
  <footer>Últimas 10 mensagens de <strong>${chat.name}</strong></footer>
</body>
</html>`)
})

app.get('/openapi.json', (_req, res) => res.json(spec))
app.get('/docs', apiReference({ spec: { url: '/openapi.json' } }))
app.get('/', (_req, res) => res.redirect('/docs'))

// ── Socket.IO ─────────────────────────────────────────────────────────────────

io.use((socket, next) => {
  if (!API_KEY) return next()
  const token = socket.handshake.auth?.token || socket.handshake.headers?.['x-api-key']
  if (token !== API_KEY) return next(new Error('Unauthorized'))
  next()
})

io.on('connection', (socket) => {
  console.log(`[ws] cliente conectado: ${socket.id}`)
  socket.on('disconnect', () => console.log(`[ws] cliente desconectado: ${socket.id}`))
})

emitter.on('qr',              (d) => io.emit('qr',              d))
emitter.on('connection',      (d) => io.emit('connection',      d))
emitter.on('message',         (d) => io.emit('message',         d))
emitter.on('message_update',  (d) => io.emit('message_update',  d))
emitter.on('contacts_synced', ()  => io.emit('contacts_synced')   )

// ── Start ─────────────────────────────────────────────────────────────────────

httpServer.listen(PORT, () => {
  console.log(`WhatsApp API rodando em http://localhost:${PORT}`)
  connect().catch(e => console.error('[connect] erro fatal:', e))
})

process.on('SIGINT',  () => { saveStore(); process.exit() })
process.on('SIGTERM', () => { saveStore(); process.exit() })
