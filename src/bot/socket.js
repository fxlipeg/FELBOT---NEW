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

// 🔒 CONTROL GLOBAL
let currentSocket = null
const processedMessages = new Set()

// 📂 CARGAR COMANDOS
const commands = new Map()
const commandsPath = path.join(__dirname, '../commands')

const files = fs.readdirSync(commandsPath)

for (const file of files) {
  if (!file.endsWith('.js')) continue

  const command = await import(`../comandos/${file}`)
  commands.set(command.default.name, command.default)

  console.log(`⚡ Comando cargado: ${command.default.name}`)
}

export async function startSocket() {

  if (currentSocket) {
    console.log('⚠️ Socket ya activo, evitando duplicado')
    return currentSocket
  }

  const { state, saveCreds } = await useMongoAuthState()
  const { version } = await fetchLatestBaileysVersion()

  const sock = makeWASocket({
    version,
    auth: state,
    printQRInTerminal: false,
    markOnlineOnConnect: false,
    syncFullHistory: false
  })

  currentSocket = sock

  sock.ev.on('creds.update', saveCreds)

  // 🟢 KEEP ALIVE
  setInterval(() => {
    try {
      sock.sendPresenceUpdate('available')
      console.log('🟢 KeepAlive OK')
    } catch {
      console.log('⚠️ KeepAlive error')
    }
  }, 30000)

  // 💬 MENSAJES
  sock.ev.on('messages.upsert', async ({ messages }) => {
    try {
      const msg = messages[0]
      if (!msg.message) return
      if (msg.key.fromMe) return

      const msgId = msg.key.id
      if (processedMessages.has(msgId)) return
      processedMessages.add(msgId)

      // limpiar memoria (evita leak)
      if (processedMessages.size > 1000) {
        processedMessages.clear()
      }

      const from = msg.key.remoteJid

      const text =
        msg.message.conversation ||
        msg.message.extendedTextMessage?.text ||
        ''

      if (!text) return

      const prefix = '.'
      if (!text.startsWith(prefix)) return

      const args = text.slice(prefix.length).trim().split(/ +/)
      const commandName = args.shift()?.toLowerCase()

      console.log(`📩 Comando recibido: ${commandName}`)

      const command = commands.get(commandName)
      if (!command) return

      await command.execute(sock, msg, args)

    } catch (err) {
      console.log('❌ Error en mensaje:', err)
    }
  })

  // 🔌 CONEXIÓN
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

      currentSocket = null

      const shouldReconnect = code !== DisconnectReason.loggedOut

      if (shouldReconnect) {
        console.log('🔄 Reconectando en 3 segundos...')
        setTimeout(() => startSocket(), 3000)
      } else {
        console.log('🚫 Sesión inválida')
      }
    }
  })

  return sock
}