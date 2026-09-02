import { Router } from 'express'
import { getChats, normalizeJidParam, getProfilePictureUrl } from '../whatsapp.js'

const router = Router()

// GET /api/chats → lista todos os chats ordenados por último mensagem
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

// GET /api/chats/:jid/picture → foto de perfil como imagem (jpeg/png)
router.get('/:jid/picture', async (req, res) => {
  const jid = normalizeJidParam(req.params.jid)
  try {
    const url = await getProfilePictureUrl(jid)
    if (!url) return res.status(404).end()
    const imgRes = await fetch(url)
    if (!imgRes.ok) return res.status(404).end()
    const buffer = await imgRes.arrayBuffer()
    res.setHeader('Content-Type', imgRes.headers.get('content-type') || 'image/jpeg')
    res.setHeader('Cache-Control', 'public, max-age=3600')
    res.send(Buffer.from(buffer))
  } catch {
    res.status(404).end()
  }
})

export default router
