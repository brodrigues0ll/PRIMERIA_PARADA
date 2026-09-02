export const spec = {
  openapi: '3.1.0',
  info: {
    title: 'WhatsApp API',
    version: '1.0.0',
    description: `
API pessoal para ler e responder mensagens do WhatsApp a partir de qualquer aplicação.

## Autenticação

Todas as rotas exigem uma API key configurada no \`.env\` (\`API_KEY\`).

Envie via header ou query string:

\`\`\`
x-api-key: sua-chave
# ou
GET /api/chats?api_key=sua-chave
\`\`\`

## Primeiro uso

Acesse \`GET /api/qr/image\` no browser para escanear o QR code com o celular.
Após conectar, a sessão fica salva em \`./auth/\` e não precisa escanear novamente.

Para obter o QR como base64 (ex: exibir na sua UI), use \`GET /api/qr\`.

## Eventos em tempo real (Socket.IO)

Conecte via Socket.IO em \`ws://localhost:3099\` para receber eventos:

| Evento | Descrição | Payload |
|---|---|---|
| \`qr\` | QR code disponível | \`{ qr: "data:image/png;base64,..." }\` |
| \`connection\` | Mudança de status | \`{ status: "connected" | "disconnected", user? }\` |
| \`message\` | Nova mensagem recebida | objeto Message |
| \`message_update\` | Atualização de status (lido, entregue) | \`{ id, jid, status }\` |

### Exemplo: auto-resposta (ping/pong)

\`\`\`js
import { io } from 'socket.io-client'

const socket = io('http://localhost:3099')

socket.on('message', async (msg) => {
  if (msg.fromMe) return
  if (msg.text.toLowerCase().trim() !== 'ping') return

  await fetch(\`http://localhost:3099/api/chats/\${msg.jid}/messages\`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': 'sua-chave',
    },
    body: JSON.stringify({ text: 'pong' }),
  })
})
\`\`\`

### Exemplo: notificar sua aplicação ao receber mensagem

\`\`\`js
socket.on('message', (msg) => {
  if (msg.fromMe) return
  console.log(\`Nova mensagem de \${msg.jid}: \${msg.text}\`)
  // atualizar estado da UI, tocar som, etc.
})
\`\`\`
    `.trim(),
  },

  servers: [{ url: 'http://localhost:3099', description: 'Local' }],

  security: [{ apiKeyHeader: [] }, { apiKeyQuery: [] }],

  components: {
    securitySchemes: {
      apiKeyHeader: {
        type: 'apiKey',
        in: 'header',
        name: 'x-api-key',
      },
      apiKeyQuery: {
        type: 'apiKey',
        in: 'query',
        name: 'api_key',
      },
    },
    schemas: {
      Message: {
        type: 'object',
        properties: {
          id:          { type: 'string', example: 'AC50F7AA7198F358D9D2' },
          jid:         { type: 'string', example: '5511999999999@s.whatsapp.net' },
          fromMe:      { type: 'boolean', example: false },
          participant: { type: 'string', nullable: true, description: 'Preenchido em grupos' },
          timestamp:   { type: 'integer', example: 1787345737 },
          text:        { type: 'string', example: 'Olá!' },
          type:        { type: 'string', example: 'conversation', enum: ['conversation', 'extendedTextMessage', 'imageMessage', 'videoMessage', 'audioMessage', 'documentMessage', 'stickerMessage', 'locationMessage'] },
          status:      { type: 'integer', nullable: true, description: '1=pendente 2=enviado 3=entregue 4=lido' },
        },
      },
      Chat: {
        type: 'object',
        properties: {
          jid:         { type: 'string', example: '5511999999999@s.whatsapp.net' },
          name:        { type: 'string', example: 'João Silva' },
          isGroup:     { type: 'boolean', example: false },
          unreadCount: { type: 'integer', example: 3 },
          timestamp:   { type: 'integer', example: 1787345737 },
          lastMessage: { $ref: '#/components/schemas/Message', nullable: true },
        },
      },
      ConnectionStatus: {
        type: 'object',
        properties: {
          status:  { type: 'string', enum: ['connected', 'disconnected', 'connecting', 'qr'] },
          hasQR:   { type: 'boolean' },
          user: {
            nullable: true,
            type: 'object',
            properties: {
              id:   { type: 'string', example: '5511999999999@s.whatsapp.net' },
              name: { type: 'string', example: 'Meu Nome' },
            },
          },
        },
      },
      Error: {
        type: 'object',
        properties: {
          error: { type: 'string', example: 'Mensagem de erro' },
        },
      },
    },
  },

  paths: {
    '/api/status': {
      get: {
        tags: ['Auth'],
        summary: 'Status da conexão',
        description: 'Retorna o estado atual da conexão com o WhatsApp e os dados do usuário logado.',
        responses: {
          200: {
            description: 'OK',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ConnectionStatus' } } },
          },
        },
      },
    },

    '/api/qr': {
      get: {
        tags: ['Auth'],
        summary: 'QR code (base64)',
        description: 'Retorna o QR code como base64 para usar no frontend. Retorna 404 quando não há QR disponível (já conectado ou ainda inicializando).',
        responses: {
          200: {
            description: 'QR code disponível',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: { qr: { type: 'string', example: 'data:image/png;base64,iVBORw0KGgo...' } },
                },
              },
            },
          },
          404: { description: 'QR indisponível', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },

    '/api/qr/image': {
      get: {
        tags: ['Auth'],
        summary: 'QR code (página HTML)',
        description: 'Abre uma página HTML com o QR code para escanear no browser. Atualiza automaticamente a cada 30s. Útil para fazer login sem escrever código.',
        responses: {
          200: { description: 'HTML com a imagem do QR code' },
        },
      },
    },

    '/api/logout': {
      delete: {
        tags: ['Auth'],
        summary: 'Desconectar',
        description: 'Encerra a sessão do WhatsApp, limpa os arquivos de autenticação e reconecta automaticamente em 1s — gerando um novo QR code. Use `GET /api/qr/image` para escanear após o logout.',
        responses: {
          200: { description: 'OK', content: { 'application/json': { schema: { type: 'object', properties: { ok: { type: 'boolean' } } } } } },
          500: { description: 'Erro', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },

    '/api/chats': {
      get: {
        tags: ['Chats'],
        summary: 'Listar chats',
        description: 'Retorna todos os chats (individuais e grupos) ordenados pela mensagem mais recente.',
        responses: {
          200: {
            description: 'Lista de chats',
            content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Chat' } } } },
          },
        },
      },
    },

    '/api/chats/{jid}': {
      get: {
        tags: ['Chats'],
        summary: 'Dados de um chat',
        description: 'Retorna informações de um chat específico. O JID pode ser o número puro (`5511999999999`) ou completo (`5511999999999@s.whatsapp.net`).',
        parameters: [
          { in: 'path', name: 'jid', required: true, schema: { type: 'string' }, example: '5511999999999', description: 'Número do contato ou JID completo' },
        ],
        responses: {
          200: { description: 'Chat encontrado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Chat' } } } },
          404: { description: 'Chat não encontrado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },

    '/api/chats/{jid}/messages': {
      get: {
        tags: ['Mensagens'],
        summary: 'Histórico de mensagens',
        description: 'Retorna as últimas N mensagens do chat, ordenadas da mais antiga para a mais recente. Máximo de 200 por chamada.',
        parameters: [
          { in: 'path',  name: 'jid',   required: true,  schema: { type: 'string' }, example: '5511999999999' },
          { in: 'query', name: 'limit', required: false, schema: { type: 'integer', default: 50, maximum: 200 }, description: 'Quantidade de mensagens' },
        ],
        responses: {
          200: { description: 'Lista de mensagens', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Message' } } } } },
        },
      },

      post: {
        tags: ['Mensagens'],
        summary: 'Enviar mensagem de texto',
        description: `Envia uma mensagem de texto para o chat.

**Exemplo — implementar ping/pong na sua aplicação:**

\`\`\`js
// Ouça mensagens via Socket.IO e responda automaticamente
socket.on('message', async (msg) => {
  if (msg.fromMe) return
  if (msg.text.trim().toLowerCase() !== 'ping') return

  await fetch(\`/api/chats/\${msg.jid}/messages\`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': 'sua-chave' },
    body: JSON.stringify({ text: 'pong' }),
  })
})
\`\`\``,
        parameters: [
          { in: 'path', name: 'jid', required: true, schema: { type: 'string' }, example: '5511999999999' },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['text'],
                properties: {
                  text: { type: 'string', example: 'Olá! Tudo bem?' },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: 'Mensagem enviada',
            content: { 'application/json': { schema: { type: 'object', properties: { ok: { type: 'boolean' }, id: { type: 'string' } } } } },
          },
          400: { description: 'Campo text ausente', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          500: { description: 'Erro ao enviar', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },

    '/api/chats/{jid}/read': {
      post: {
        tags: ['Mensagens'],
        summary: 'Marcar como lido',
        description: 'Marca a última mensagem do chat como lida, zerando o contador de não lidas.',
        parameters: [
          { in: 'path', name: 'jid', required: true, schema: { type: 'string' }, example: '5511999999999' },
        ],
        responses: {
          200: { description: 'OK', content: { 'application/json': { schema: { type: 'object', properties: { ok: { type: 'boolean' } } } } } },
          500: { description: 'Erro', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
  },

  tags: [
    { name: 'Auth',      description: 'Autenticação e status da conexão' },
    { name: 'Chats',     description: 'Listagem e busca de conversas' },
    { name: 'Mensagens', description: 'Leitura e envio de mensagens' },
  ],
}
