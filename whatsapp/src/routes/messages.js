import { Router } from 'express'
import { getChatMessages, sendText, markAsRead, normalizeJidParam } from '../whatsapp.js'

const router = Router()

// GET /api/chats/:jid/messages?limit=50
// Retorna as últimas N mensagens do chat
router.get('/:jid/messages', (req, res) => {
  const jid   = normalizeJidParam(req.params.jid)
  const limit = Math.min(parseInt(req.query.limit) || 50, 200)
  res.json(getChatMessages(jid, limit))
})

// POST /api/chats/:jid/messages
// Body: { text: "mensagem" }
// Envia uma mensagem de texto
router.post('/:jid/messages', async (req, res) => {
  const jid  = normalizeJidParam(req.params.jid)
  const { text } = req.body

  if (!text?.trim()) {
    return res.status(400).json({ error: 'Campo "text" é obrigatório' })
  }

  try {
    const result = await sendText(jid, text.trim())
    res.status(201).json({ ok: true, id: result?.key?.id })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/chats/:jid/read
// Marca todas as mensagens do chat como lidas
router.post('/:jid/read', async (req, res) => {
  const jid = normalizeJidParam(req.params.jid)
  try {
    await markAsRead(jid)
    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
