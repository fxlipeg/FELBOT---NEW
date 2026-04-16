import makeWASocket, {
  fetchLatestBaileysVersion,
  DisconnectReason
} from '@whiskeysockets/baileys'

import qrTerm from 'qrcode-terminal'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { useMongoAuthState } from '../mongoAuth.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 🔥 CARGAR COMANDOS
const commands = new Map()

const commandsPath = path.join(__dirname, '../commands')

fs.readdirSync(commandsPath).forEach(file => {
  if (!file.endsWith('.js')) return

  const command = require(path.join(commandsPath, file))

  if (command.name) {
    commands.set(command.name, command)
    console.log(`✅ Comando cargado: ${command.name}`)
  }
})

export async function startSocket() {

  const { state, saveCreds } = await useMongoAuthState()
  const { version } = await fetchLatestBaileysVersion()

  const sock = makeWASocket({
    version,
    auth: state,
    printQRInTerminal: false,
    markOnlineOnConnect: false,
    syncFullHistory: false
  })

  sock.ev.on('creds.update', saveCreds)

  sock.ev.on('messages.upsert', async ({ messages }) => {
    const msg = messages[0]
    if (!msg.message) return
    if (msg.key.fromMe) return

    const from = msg.key.remoteJid

    const text =
      msg.message.conversation ||
      msg.message.extendedTextMessage?.text ||
      ''

    if (!text) return

    console.log(`📩 Mensaje: ${text}`)

    // 🔥 PREFIJO
    const prefix = '.'

    if (!text.startsWith(prefix)) return

    const args = text.slice(prefix.length).trim().split(/ +/)
    const cmdName = args.shift().toLowerCase()

    console.log(`⚡ Comando recibido: ${cmdName}`)

    const command = commands.get(cmdName)

    if (!command) {
      console.log('❌ Comando no encontrado')
      return
    }

    try {
      await command.execute(sock, msg, args)
    } catch (err) {
      console.error('❌ Error ejecutando comando:', err)
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

      if (shouldReconnect) {
        startSocket()
      } else {
        console.log('🚫 Sesión inválida')
      }
    }
  })

  return sock
}