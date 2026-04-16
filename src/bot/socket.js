import makeWASocket, {
  fetchLatestBaileysVersion,
  DisconnectReason
} from '@whiskeysockets/baileys'

import qrTerm from 'qrcode-terminal'
import { useMongoAuthState } from '../mongoAuth.js'

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 🔥 carga comandos simple (sin spam)
async function loadCommands() {
  const commands = new Map()
  const dir = path.join(__dirname, '../commands')

  const files = fs.readdirSync(dir).filter(f => f.endsWith('.js'))

  for (const file of files) {
    try {
      const mod = await import(`../commands/${file}`)

      const name = mod.name || mod.default?.name || file.replace('.js', '')
      const execute = mod.execute || mod.default?.execute || mod.default

      if (!name || !execute) continue

      commands.set(name.toLowerCase(), { execute })
    } catch {}
  }

  return commands
}

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

  sock.ev.on('messages.upsert', async ({ messages }) => {
    const msg = messages?.[0]
    if (!msg?.message) return
    if (msg.key.fromMe) return
    if (msg.key.remoteJid === 'status@broadcast') return

    const from = msg.key.remoteJid

    const text =
      msg.message.conversation ||
      msg.message.extendedTextMessage?.text ||
      msg.message.imageMessage?.caption ||
      msg.message.videoMessage?.caption ||
      ''

    if (!text) return

    const body = text.trim()
    const args = body.split(/ +/)
    const cmd = args.shift().toLowerCase()

    const command = commands.get(cmd)

    console.log(`📩 ${body}`)

    if (command) {
      try {
        await command.execute(sock, msg, args)
      } catch {}
    }
  })

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update

    if (qr) {
      console.log('📲 Escanea el QR:')
      qrTerm.generate(qr, { small: true })
    }

    if (connection === 'open') {
      console.log('✅ CONECTADO (MONGO)')
    }

    if (connection === 'close') {
      const code = lastDisconnect?.error?.output?.statusCode

      console.log('❌ Conexión cerrada:', code)

      const shouldReconnect = code !== DisconnectReason.loggedOut

      if (shouldReconnect) startSocket()
      else console.log('🚫 Sesión inválida')
    }
  })

  return sock
}