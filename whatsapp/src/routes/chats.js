import { Router } from 'express'
import { getChats, normalizeJidParam, getProfilePictureUrl, debugContact } from '../whatsapp.js'

const router = Router()

// Cache de fotos: jid → { data: Buffer, contentType: string, cachedAt: number }
const pictureCache = new Map()
const PICTURE_TTL  = 24 * 60 * 60 * 1000 // 24h em ms

// Reset diário às 10h (horário local do container = São Paulo)
function scheduleReset() {
  const now  = new Date()
  const next = new Date()
  next.setHours(10, 0, 0, 0)
  if (next <= now) next.setDate(next.getDate() + 1)
  setTimeout(() => {
    pictureCache.clear()
    console.log('[pictures] cache limpo às 10h')
    scheduleReset()
  }, next - now)
}
scheduleReset()

// GET /api/chats → lista todos os chats ordenados por última mensagem
router.get('/', (_req, res) => {
  res.json(getChats())
})

// GET /api/chats/:jid → dados de um chat específico
router.get('/:jid', (req, res) => {
  const jid   = normalizeJidParam(req.params.jid)
  const chats = getChats()
  const chat  = chats.find(c => c.jid === jid)
  if (!chat) return res.status(404).json({ error: 'Chat não encontrado' })
  res.json(chat)
})

// GET /api/chats/:jid/debug → diagnóstico do contato no store
router.get('/:jid/debug', (req, res) => {
  const jid = normalizeJidParam(req.params.jid)
  res.json(debugContact(jid))
})

// Deduplicação de fetches concorrentes para o mesmo JID
const picPending = new Map() // jid → Promise

// GET /api/chats/:jid/picture → foto de perfil como imagem (com cache 24h)
router.get('/:jid/picture', async (req, res) => {
  const jid    = normalizeJidParam(req.params.jid)

  // Cache hit — null = sabemos que não tem foto
  if (pictureCache.has(jid)) {
    const cached = pictureCache.get(jid)
    if (!cached) {
      res.setHeader('Cache-Control', 'public, max-age=3600')
      return res.status(404).end()
    }
    res.setHeader('Content-Type', cached.contentType)
    res.setHeader('Cache-Control', 'public, max-age=86400, stale-while-revalidate=86400')
    return res.send(cached.data)
  }

  // Se já há um fetch em andamento para este JID, aguarda o mesmo
  if (picPending.has(jid)) {
    try { await picPending.get(jid) } catch {}
    return res.redirect(307, req.path) // reprocessa com o cache já preenchido
  }

  const promise = (async () => {
    try {
      const url = await getProfilePictureUrl(jid)
      if (!url) { pictureCache.set(jid, null); return }
      const imgRes = await fetch(url)
      if (!imgRes.ok) { pictureCache.set(jid, null); return }
      const data        = Buffer.from(await imgRes.arrayBuffer())
      const contentType = imgRes.headers.get('content-type') || 'image/jpeg'
      pictureCache.set(jid, { data, contentType, cachedAt: Date.now() })
    } catch {
      pictureCache.set(jid, null)
    } finally {
      picPending.delete(jid)
    }
  })()

  picPending.set(jid, promise)
  await promise

  const cached = pictureCache.get(jid)
  if (!cached) {
    res.setHeader('Cache-Control', 'public, max-age=3600')
    return res.status(404).end()
  }
  res.setHeader('Content-Type', cached.contentType)
  res.setHeader('Cache-Control', 'public, max-age=86400, stale-while-revalidate=86400')
  res.send(cached.data)
})

export default router
