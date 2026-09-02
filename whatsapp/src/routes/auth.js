import { Router } from 'express'
import { getStatus, getQR, getQRBuffer, logout } from '../whatsapp.js'

const router = Router()

const qrHtml = (qr, status) => {
  if (!qr) return `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="utf-8"><title>WhatsApp QR</title>
<meta http-equiv="refresh" content="3">
<style>body{font-family:sans-serif;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#f0f2f5;color:#333}</style>
</head>
<body>
  <p>${status === 'connected' ? '✅ WhatsApp conectado.' : '⏳ Aguardando QR code… recarregando em 3s.'}</p>
</body></html>`

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="utf-8"><title>WhatsApp QR</title>
<meta http-equiv="refresh" content="30">
<style>
  body{font-family:sans-serif;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#f0f2f5}
  h2{color:#128c7e;margin-bottom:8px}
  p{color:#666;margin:0 0 20px;font-size:14px}
  img{border:8px solid #fff;border-radius:12px;box-shadow:0 4px 20px rgba(0,0,0,.15)}
</style>
</head>
<body>
  <h2>WhatsApp</h2>
  <p>Escaneie o QR code com o celular</p>
  <img src="data:image/png;base64,${qr.split(',')[1]}" alt="QR Code" width="300">
  <p style="margin-top:16px;font-size:12px;color:#999">Atualiza automaticamente em 30s</p>
</body></html>`
}

// GET /api/status → estado da conexão + dados do usuário logado
router.get('/status', (_req, res) => {
  res.json(getStatus())
})

// GET /api/qr → base64 JSON { qr: "data:image/png;base64,..." }
router.get('/qr', async (_req, res) => {
  const qr = await getQR()
  if (!qr) return res.status(404).json({ error: 'QR indisponível. WhatsApp já está conectado ou ainda está inicializando.' })
  res.json({ qr })
})

// GET /api/qr/image → HTML com a imagem para abrir no browser
router.get('/qr/image', async (_req, res) => {
  const qr           = await getQR()
  const { status }   = getStatus()
  res.setHeader('Cache-Control', 'no-store')
  res.send(qrHtml(qr, status))
})

// DELETE /api/logout → desconecta e limpa a sessão
router.delete('/logout', async (_req, res) => {
  try {
    await logout()
    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
