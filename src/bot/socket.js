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
// 🔥 LOADER (SOPORTA execute + reacciones)
// ===============================
async function loadCommands() {
  const commands = new Map()
  const reactions = []

  const dir = path.join(__dirname, '../commands')
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.js'))

  for (const file of files) {
    try {
      const mod = await import(`../commands/${file}`)
      const cmd = mod.default || mod

      // 🔹 comandos normales
      if (cmd.name) {
        let names = cmd.name
        if (!Array.isArray(names)) names = [names]

        for (let n of names) {
          n = String(n).toLowerCase()
          commands.set(n, cmd)
          console.log(`✅ Comando cargado: ${n}`)
        }
      }

      // 🔥 handler de reacciones (VS)
      if (mod.handleReaccion) {
        reactions.push(mod.handleReaccion)
        console.log(`⚡ Handler reacción cargado: ${file}`)
      }

    } catch (err) {
      console.log(`❌ Error cargando ${file}`, err)
    }
  }

  return { commands, reactions }
}

// ===============================
// 🚀 SOCKET
// ===============================
let reconnecting = false

export async function startSocket() {

  const { state, saveCreds } = await useMongoAuthState()
  const { version } = await fetchLatestBaileysVersion()

  const { commands, reactions } = await loadCommands()

  const sock = makeWASocket({
    version,
    auth: state,
    printQRInTerminal: false
  })

  sock.ev.on('creds.update', saveCreds)

  // ===============================
  // 🧠 MENSAJES
  // ===============================
  sock.ev.on('messages.upsert', async ({ messages }) => {
    try {
      const msg = messages?.[0]
      if (!msg?.message) return
      if (msg.key.fromMe) return

      const from = msg.key.remoteJid

      // ===============================
      // 🔥 REACCIONES (VS.JS)
      // ===============================
      for (const handler of reactions) {
        try {
          await handler(sock, msg, from)
        } catch {}
      }

      // ===============================
      // 📩 TEXTO
      // ===============================
      const text =
        msg.message.conversation ||
        msg.message.extendedTextMessage?.text ||
        msg.message.imageMessage?.caption ||
        msg.message.videoMessage?.caption ||
        ''

      if (!text) return

      const body = text.trim()

      const prefixes = ['.', '!', '/']
      const prefix = prefixes.find(p => body.startsWith(p))
      if (!prefix) return

      const withoutPrefix = body.slice(prefix.length).trim()
      const args = withoutPrefix.split(/ +/)
      const cmdName = args.shift()?.toLowerCase()

      if (!cmdName) return

      const command = commands.get(cmdName)
      if (!command) return

      console.log(`⚡ comando: ${cmdName}`)

      const sender = msg.key.participant || msg.key.remoteJid

      const context = {
        sock,
        msg,
        from,
        args,
        sender,
        command: cmdName, // 🔥 CLAVE PARA VS.JS

        reply: (text) =>
          sock.sendMessage(from, { text }, { quoted: msg }),

        react: (emoji) =>
          sock.sendMessage(from, {
            react: { text: emoji, key: msg.key }
          })
      }

      // 🔥 EJECUCIÓN COMPATIBLE
      if (typeof command.execute === 'function') {
        await command.execute(context)
      } else if (typeof command === 'function') {
        await command(context)
      }

    } catch (err) {
      console.log('❌ Error handler:', err)
    }
  })

  // ===============================
  // 🔌 CONEXIÓN
  // ===============================
  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update

    if (qr) {
      console.log('📲 Escanea QR:')
      qrTerm.generate(qr, { small: true })
    }

    if (connection === 'open') {
      console.log('✅ CONECTADO')
      reconnecting = false
    }

    if (connection === 'close') {
      const code = lastDisconnect?.error?.output?.statusCode
      console.log('❌ Conexión cerrada:', code)

      if (code === 401) {
        await Session.deleteOne({ _id: 'auth' })
        console.log('🧹 sesión borrada')
        return startSocket()
      }

      if (code === 440) {
        console.log('🚫 conflicto (otra sesión abierta)')
        return
      }

      if (reconnecting) return
      reconnecting = true

      setTimeout(() => startSocket(), 3000)
    }
  })

  return sock
}