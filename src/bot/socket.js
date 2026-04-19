import makeWASocket, {
  fetchLatestBaileysVersion,
  DisconnectReason
} from '@whiskeysockets/baileys'

import qrTerm from 'qrcode-terminal'
import { useMongoAuthState } from '../mongoAuth.js'
import Session from '../models/session.js'

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// ===============================
// 🔥 LOADER BLINDADO
// ===============================
async function loadCommands() {
  const commands = new Map()
  const dir = path.join(__dirname, '../commands')

  if (!fs.existsSync(dir)) return commands

  const files = fs.readdirSync(dir).filter(f => f.endsWith('.js'))

  for (const file of files) {
    try {
      const mod = await import(`../commands/${file}`)
      const cmd = mod.default || mod

      const execute = cmd.execute || cmd
      if (typeof execute !== 'function') continue

      let names = cmd.name ?? file.replace('.js', '')

      if (!Array.isArray(names)) names = [names]

      for (let n of names) {
        if (!n) continue
        n = String(n).toLowerCase().trim()
        if (!n) continue

        commands.set(n, execute)
        console.log(`✅ Comando cargado: ${n}`)
      }

    } catch (err) {
      console.log(`❌ Error cargando ${file}`, err)
    }
  }

  return commands
}

// ===============================
// 🚀 SOCKET
// ===============================
let reconnecting = false

export async function startSocket() {

  const { state, saveCreds } = await useMongoAuthState()
  const { version } = await fetchLatestBaileysVersion()
  const commands = await loadCommands()

  const sock = makeWASocket({
    version,
    auth: state,
    printQRInTerminal: false,
    markOnlineOnConnect: false,
    syncFullHistory: false
  })

  sock.ev.on('creds.update', saveCreds)

  // ===============================
  // 🧠 HANDLER MENSAJES
  // ===============================
  sock.ev.on('messages.upsert', async ({ messages }) => {
    try {
      const msg = messages?.[0]
      if (!msg?.message) return
      if (msg.key.fromMe) return
      if (msg.key.remoteJid === 'status@broadcast') return
      if (msg.messageStubType) return

      const from = msg.key.remoteJid

      const text =
        msg.message.conversation ||
        msg.message.extendedTextMessage?.text ||
        msg.message.imageMessage?.caption ||
        msg.message.videoMessage?.caption ||
        ''

      if (!text) return

      const body = text.trim()

      // 🔥 FIX PREFIX (CORRECTO)
      const prefixes = ['.', '!', '/']
      const prefix = prefixes.find(p => body.startsWith(p))
      if (!prefix) return

      const withoutPrefix = body.slice(prefix.length).trim()
      const args = withoutPrefix.split(/ +/)
      const cmd = args.shift()?.toLowerCase()

      if (!cmd) return

      const command = commands.get(cmd)
      if (!command) return

      console.log(`⚡ comando: ${cmd}`)

      const sender = msg.key.participant || msg.key.remoteJid

      const context = {
        sock,
        msg,
        from,
        args,
        sender,

        reply: (text) =>
          sock.sendMessage(from, { text }, { quoted: msg }),

        react: (emoji) =>
          sock.sendMessage(from, {
            react: { text: emoji, key: msg.key }
          })
      }

      await command(context)

    } catch (err) {
      console.log('❌ Error handler:', err)
    }
  })

  // ===============================
  // 🔌 CONEXIÓN (ANTI LOOP + QR FIX)
  // ===============================
  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update

    if (qr) {
      console.log('📲 Escanea QR:')
      qrTerm.generate(qr, { small: true })
    }

    if (connection === 'open') {
      console.log('✅ CONECTADO (MONGO)')
      reconnecting = false
    }

    if (connection === 'close') {
      const code = lastDisconnect?.error?.output?.statusCode

      console.log('❌ Conexión cerrada:', code)

      // 💣 SESIÓN ROTA
      if (code === 401) {
        console.log('🧹 Eliminando sesión corrupta...')
        await Session.deleteOne({ _id: 'auth' })

        console.log('🔄 Reiniciando para QR...')
        setTimeout(() => startSocket(), 2000)
        return
      }

      // 🚫 conflicto
      if (code === 440) {
        console.log('🚫 Sesión reemplazada (conflict)')
        return
      }

      // 🚫 logout
      if (code === DisconnectReason.loggedOut) {
        console.log('🚫 Sesión cerrada → necesitas QR')
        return
      }

      if (reconnecting) return
      reconnecting = true

      console.log('🔄 Reconectando...')

      setTimeout(() => startSocket(), 3000)
    }
  })

  return sock
}//