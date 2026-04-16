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

// 🔥 normaliza comandos
function normalizeCommand(cmd = '') {
  return cmd.toLowerCase().replace(/[^a-z0-9]/g, '').trim()
}

// 🔥 carga comandos (simple y estable)
async function loadCommands(dir) {
  const commands = new Map()
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.js'))

  for (const file of files) {
    try {
      const mod = await import(`../commands/${file}`)

      const name = mod.name || mod.default?.name || file.replace('.js', '')
      const execute = mod.execute || mod.default?.execute || mod.default

      if (!name || !execute) continue

      commands.set(normalizeCommand(name), { name, execute })

      console.log(`⚡ Comando cargado: ${name}`)
    } catch (e) {
      console.log(`❌ Error cargando ${file}:`, e.message)
    }
  }

  return commands
}

export async function startSocket() {

  const { state, saveCreds } = await useMongoAuthState()
  const { version } = await fetchLatestBaileysVersion()

  const commandsPath = path.join(__dirname, '../commands')
  const commands = await loadCommands(commandsPath)

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
    if (msg.messageStubType) return
    if (msg.message?.protocolMessage) return

    const from = msg.key.remoteJid

    const rawText =
      msg.message.conversation ||
      msg.message.extendedTextMessage?.text ||
      msg.message.imageMessage?.caption ||
      msg.message.videoMessage?.caption ||
      msg.message.buttonsResponseMessage?.selectedButtonId ||
      msg.message.listResponseMessage?.singleSelectReply?.selectedRowId ||
      ''

    const body = rawText?.trim()
    if (!body) return

    const parts = body.split(/ +/)
    const commandName = normalizeCommand(parts[0])
    const args = parts.slice(1)

    if (!commandName) return

    console.log(`📩 Comando recibido: ${commandName}`)

    const command = commands.get(commandName)

    if (!command) {
      console.log(`⚠️ No existe comando: ${commandName}`)
      return
    }

    try {
      await command.execute(sock, msg, args)
    } catch (err) {
      console.log(`❌ Error ejecutando ${commandName}:`, err)
    }
  })

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
      console.log('❌ Conexión cerrada:', code)

      const shouldReconnect = code !== DisconnectReason.loggedOut

      if (shouldReconnect) startSocket()
      else console.log('🚫 Sesión inválida')
    }
  })

  return sock
}