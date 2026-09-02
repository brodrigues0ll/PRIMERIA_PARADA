import { Router } from 'express'
import { emitter } from '../whatsapp.js'

const router = Router()

router.get('/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache, no-transform')
  res.setHeader('Connection', 'keep-alive')
  res.setHeader('X-Accel-Buffering', 'no')
  res.flushHeaders()

  const send = (event, data) => {
    try { res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`) } catch {}
  }

  const onMessage    = (d) => send('message', d)
  const onUpdate     = (d) => send('message_update', d)
  const onConnection = (d) => send('connection', d)

  emitter.on('message',        onMessage)
  emitter.on('message_update', onUpdate)
  emitter.on('connection',     onConnection)

  const ping = setInterval(() => { try { res.write(': ping\n\n') } catch {} }, 25000)

  req.on('close', () => {
    clearInterval(ping)
    emitter.off('message',        onMessage)
    emitter.off('message_update', onUpdate)
    emitter.off('connection',     onConnection)
  })
})

export default router
