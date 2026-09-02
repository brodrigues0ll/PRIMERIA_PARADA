// frontend/lib/waDb.js
// Wrapper de IndexedDB sem dependências externas.
// Guarda `chats` (keyPath: jid) e `messages` (keyPath: [jid, id]).
// Todas as funções retornam Promise e são seguras para uso em "use client".
// Em SSR (typeof window === 'undefined') retornam imediatamente sem fazer nada.

const IS_BROWSER = typeof window !== 'undefined'

const DB_NAME    = 'wa-store'
const DB_VERSION = 1

function openDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = (e) => {
      const d = e.target.result
      if (!d.objectStoreNames.contains('chats'))
        d.createObjectStore('chats', { keyPath: 'jid' })
      if (!d.objectStoreNames.contains('messages')) {
        const s = d.createObjectStore('messages', { keyPath: ['jid', 'id'] })
        s.createIndex('byJid', 'jid')
      }
    }
    req.onsuccess = (e) => resolve(e.target.result)
    req.onerror   = (e) => reject(e.target.error)
  })
}

let _db = null
async function getDb() {
  if (!_db) _db = await openDb()
  return _db
}

export async function idbGetChats() {
  if (!IS_BROWSER) return []
  const d = await getDb()
  return new Promise((res, rej) => {
    const r = d.transaction('chats', 'readonly').objectStore('chats').getAll()
    r.onsuccess = () => res(r.result || [])
    r.onerror   = () => rej(r.error)
  })
}

export async function idbSaveChats(chats) {
  if (!IS_BROWSER) return
  const d  = await getDb()
  const tx = d.transaction('chats', 'readwrite')
  const st = tx.objectStore('chats')
  for (const c of chats) st.put(c)
  return new Promise((res, rej) => { tx.oncomplete = res; tx.onerror = () => rej(tx.error) })
}

export async function idbGetMessages(jid) {
  if (!IS_BROWSER) return []
  const d = await getDb()
  return new Promise((res, rej) => {
    const idx = d.transaction('messages', 'readonly').objectStore('messages').index('byJid')
    const r   = idx.getAll(IDBKeyRange.only(jid))
    r.onsuccess = () => res(r.result || [])
    r.onerror   = () => rej(r.error)
  })
}

export async function idbSaveMessages(messages) {
  if (!IS_BROWSER) return
  const d  = await getDb()
  const tx = d.transaction('messages', 'readwrite')
  const st = tx.objectStore('messages')
  for (const m of messages) st.put(m)
  return new Promise((res, rej) => { tx.oncomplete = res; tx.onerror = () => rej(tx.error) })
}

export async function idbUpsertMessage(msg) {
  if (!IS_BROWSER) return
  const d  = await getDb()
  const tx = d.transaction('messages', 'readwrite')
  tx.objectStore('messages').put(msg)
  return new Promise((res, rej) => { tx.oncomplete = res; tx.onerror = () => rej(tx.error) })
}

export async function idbUpdateChat(chat) {
  if (!IS_BROWSER) return
  const d  = await getDb()
  const tx = d.transaction('chats', 'readwrite')
  tx.objectStore('chats').put(chat)
  return new Promise((res, rej) => { tx.oncomplete = res; tx.onerror = () => rej(tx.error) })
}

export async function idbClearAll() {
  if (!IS_BROWSER) return
  const d  = await getDb()
  const tx = d.transaction(['chats', 'messages'], 'readwrite')
  tx.objectStore('chats').clear()
  tx.objectStore('messages').clear()
  return new Promise((res, rej) => { tx.oncomplete = res; tx.onerror = () => rej(tx.error) })
}
