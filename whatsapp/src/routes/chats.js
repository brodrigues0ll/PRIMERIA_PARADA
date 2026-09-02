import { Router } from 'express'
import { getChats, normalizeJidParam } from '../whatsapp.js'

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

export default router
