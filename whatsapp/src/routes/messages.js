import { Router } from 'express'
import { getChatMessages, sendText, sendMedia, markAsRead, normalizeJidParam, downloadMedia } from '../whatsapp.js'

const router = Router()

// GET /api/chats/:jid/messages?limit=50
// Retorna as últimas N mensagens do chat
router.get('/:jid/messages', (req, res) => {
  const jid   = normalizeJidParam(req.params.jid)
  const limit = Math.min(parseInt(req.query.limit) || 50, 200)
  res.json(getChatMessages(jid, limit))
})

// POST /api/chats/:jid/messages
// Body: { text: "mensagem", quotedMessageId?: "id" }
// Envia uma mensagem de texto
router.post('/:jid/messages', async (req, res) => {
  const jid  = normalizeJidParam(req.params.jid)
  const { text, quotedMessageId } = req.body
  if (!text?.trim()) return res.status(400).json({ error: 'Campo "text" é obrigatório' })
  try {
    const result = await sendText(jid, text.trim(), quotedMessageId || null)
    res.status(201).json({ ok: true, id: result?.key?.id })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/chats/:jid/messages/media
// Body: { type, base64, mimetype, filename?, caption?, quotedMessageId? }
// Envia uma mensagem de mídia
router.post('/:jid/messages/media', async (req, res) => {
  const jid = normalizeJidParam(req.params.jid)
  const { type, base64, mimetype, filename, caption, quotedMessageId } = req.body
  if (!type || !base64 || !mimetype) {
    return res.status(400).json({ error: 'Campos "type", "base64" e "mimetype" são obrigatórios' })
  }
  try {
    const buffer = Buffer.from(base64, 'base64')
    const result = await sendMedia(jid, { type, buffer, mimetype, filename, caption, quotedMessageId })
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

// GET /api/chats/:jid/messages/:msgId/media
// Retorna o binário da mídia (imagem, sticker, vídeo, áudio)
router.get('/:jid/messages/:msgId/media', async (req, res) => {
  const jid   = normalizeJidParam(req.params.jid)
  const msgId = req.params.msgId
  try {
    const { buffer, mime } = await downloadMedia(jid, msgId)
    res.setHeader('Content-Type', mime)
    res.setHeader('Cache-Control', 'public, max-age=86400')
    res.send(buffer)
  } catch (err) {
    res.status(404).json({ error: err.message })
  }
})

export default router
