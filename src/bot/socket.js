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

let sock = null
let isRestarting = false
let keepAliveInterval = null

const commands = new Map()
const cooldowns = new Map()

// =======================
// 🔥 CARGAR COMANDOS
// =======================
async function loadCommands() {
  commands.clear()

  const commandsPath = path.join(__dirname, '../commands')
  const files = fs.readdirSync(commandsPath)

  for (const file of files) {
    if (!file.endsWith('.js')) continue

    try {
      const cmd = await import(`../commands/${file}?v=${Date.now()}`)
      const command = cmd.default

      commands.set(command.name, command)

      if (command.aliases) {
        for (const alias of command.aliases) {
          commands.set(alias, command)
        }
      }

    } catch (err) {
      console.log(`❌ Error cargando ${file}:`, err.message)
    }
  }

  console.log('✅ COMANDOS:', [...commands.keys()])
}

// =======================
// 🔥 RESTART SEGURO
// =======================
async function safeRestart() {
  if (isRestarting) return
  isRestarting = true

  console.log('🔄 Reinicio controlado...')

  try {
    if (keepAliveInterval) {
      clearInterval(keepAliveInterval)
      keepAliveInterval = null
    }

    if (sock?.ws) {
      sock.ws.close()
    }

    sock = null

  } catch {}

  setTimeout(async () => {
    isRestarting = false
    await startSocket()
  }, 5000)
}

// =======================
// 🚀 SOCKET PRINCIPAL
// =======================
export async function startSocket() {

  await loadCommands()

  const { state, saveCreds } = await useMongoAuthState()
  const { version } = await fetchLatestBaileysVersion()

  sock = makeWASocket({
    version,
    auth: state,
    printQRInTerminal: false,
    markOnlineOnConnect: true,
    syncFullHistory: false,
    browser: ['FelBot', 'Chrome', '1.0']
  })

  sock.ev.on('creds.update', saveCreds)

  // =======================
  // 📩 MENSAJES
  // =======================
  sock.ev.on('messages.upsert', async ({ messages }) => {
    try {
      const msg = messages[0]
      if (!msg.message) return
      if (msg.key.fromMe) return

      const from = msg.key.remoteJid
      const isGroup = from.endsWith('@g.us')

      const sender = isGroup
        ? msg.key.participant
        : from

      const text =
        msg.message.conversation ||
        msg.message.extendedTextMessage?.text ||
        ''

      if (!text) return

      const prefix = '.'
      if (!text.startsWith(prefix)) return

      const args = text.slice(prefix.length).trim().split(/ +/)
      const commandName = args.shift()?.toLowerCase()

      const command = commands.get(commandName)
      if (!command) return

      console.log(`⚡ ${commandName} | ${sender}`)

      // 🔒 SOLO GRUPOS
      if (command.groupOnly && !isGroup) {
        return sock.sendMessage(from, {
          text: '❌ Solo para grupos'
        }, { quoted: msg })
      }

      // 🔒 SOLO ADMINS
      if (command.adminOnly && isGroup) {
        const metadata = await sock.groupMetadata(from)
        const admins = metadata.participants
          .filter(p => p.admin)
          .map(p => p.id)

        if (!admins.includes(sender)) {
          return sock.sendMessage(from, {
            text: '❌ Solo admins'
          }, { quoted: msg })
        }
      }

      // ⏱️ COOLDOWN
      if (command.cooldown) {
        const now = Date.now()
        const timestamps = cooldowns.get(command.name) || new Map()

        const userTime = timestamps.get(sender) || 0
        const cooldownTime = command.cooldown * 1000

        if (now - userTime < cooldownTime) {
          const remaining = ((cooldownTime - (now - userTime)) / 1000).toFixed(1)

          return sock.sendMessage(from, {
            text: `⏳ Espera ${remaining}s`
          }, { quoted: msg })
        }

        timestamps.set(sender, now)
        cooldowns.set(command.name, timestamps)
      }

      // 🚀 EJECUTAR
      await command.execute({
        sock,
        from,
        msg,
        args,
        sender,
        isGroup
      })

    } catch (err) {
      console.log('❌ ERROR MENSAJE:', err)
    }
  })

  // =======================
  // 🔌 CONEXIÓN
  // =======================
  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update

    if (qr) {
      console.log('📲 Escanea el QR:')
      qrTerm.generate(qr, { small: true })
    }

    if (connection === 'open') {
      console.log('✅ CONECTADO')
    }

    if (connection === 'close') {
      const code = lastDisconnect?.error?.output?.statusCode

      console.log('❌ Cerrado:', code)

      if (code !== DisconnectReason.loggedOut) {
        await safeRestart()
      } else {
        console.log('🚫 Sesión inválida (borra Mongo)')
      }
    }
  })

  // =======================
  // 🟢 KEEP ALIVE REAL
  // =======================
  keepAliveInterval = setInterval(async () => {
    try {
      if (!sock) return

      await sock.sendPresenceUpdate('available')
      console.log('🟢 KeepAlive OK')

    } catch (err) {
      console.log('⚠️ KeepAlive falló')
      await safeRestart()
    }
  }, 30000)

  return sock
}