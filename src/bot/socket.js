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

let sock
const commands = new Map()
const cooldowns = new Map()

// 🔥 CARGAR COMANDOS
async function loadCommands() {
  commands.clear()

  const commandsPath = path.join(__dirname, '../commands')
  const files = fs.readdirSync(commandsPath)

  for (const file of files) {
    if (!file.endsWith('.js')) continue

    try {
      const cmd = await import(`../commands/${file}?update=${Date.now()}`)
      const command = cmd.default

      commands.set(command.name, command)

      // aliases
      if (command.aliases) {
        for (const alias of command.aliases) {
          commands.set(alias, command)
        }
      }

    } catch (err) {
      console.log(`❌ Error en ${file}:`, err.message)
    }
  }

  console.log('✅ COMANDOS:', [...commands.keys()])
}

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

  // 🔥 MENSAJES
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

      // 🔥 LOG LIMPIO
      console.log(`⚡ ${commandName} | ${sender}`)

      // 🔒 SOLO GRUPOS
      if (command.groupOnly && !isGroup) {
        return sock.sendMessage(from, {
          text: '❌ Este comando es solo para grupos'
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
            text: '❌ Solo admins pueden usar este comando'
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
      console.log('❌ ERROR:', err)
    }
  })

  // 🔥 CONEXIÓN
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
        console.log('🔄 Reconectando...')
        setTimeout(() => startSocket(), 3000)
      } else {
        console.log('🚫 Sesión inválida')
      }
    }
  })

  // 🔥 KEEP ALIVE
  setInterval(async () => {
    try {
      if (!sock) return

      await sock.sendPresenceUpdate('available')
      await loadCommands()

      console.log('🟢 KeepAlive OK')

    } catch {
      console.log('⚠️ Socket muerto → reiniciando')
      startSocket()
    }
  }, 30000)

  return sock
}