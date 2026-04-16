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

function normalizeCommand(cmd = '') {
  return cmd
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .trim()
}

// 🔥 CARGA RECURSIVA DE COMANDOS (subcarpetas incluidas)
async function loadCommands(dir) {
  const commands = new Map()

  function readFolder(folder) {
    const files = fs.readdirSync(folder)

    for (const file of files) {
      const fullPath = path.join(folder, file)
      const stat = fs.statSync(fullPath)

      if (stat.isDirectory()) {
        readFolder(fullPath)
      } else if (file.endsWith('.js')) {
        import(fullPath).then((cmd) => {

          const name =
            cmd.name ||
            cmd.default?.name ||
            file.replace('.js', '')

          const execute =
            cmd.execute ||
            cmd.default?.execute ||
            cmd.default

          if (!name || !execute) {
            console.log(`⚠️ Comando inválido: ${file}`)
            return
          }

          commands.set(normalizeCommand(name), {
            name,
            execute
          })

          console.log(`⚡ Comando cargado: ${name}`)
        }).catch(err => {
          console.log(`❌ Error cargando ${file}:`, err.message)
        })
      }
    }
  }

  readFolder(dir)

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

    const from = msg.key.remoteJid

    const text =
      msg.message.conversation ||
      msg.message.extendedTextMessage?.text ||
      msg.message.imageMessage?.caption ||
      msg.message.videoMessage?.caption ||
      msg.message.buttonsResponseMessage?.selectedButtonId ||
      msg.message.listResponseMessage?.singleSelectReply?.selectedRowId ||
      ''

    if (!text) return

    const body = text.trim()

    const args = body.split(/ +/).slice(1)
    const commandName = normalizeCommand(body.split(/ +/)[0])

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
      console.log('✅ CONECTADO (TOTAL MODE)')
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