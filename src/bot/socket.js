import makeWASocket, {
  fetchLatestBaileysVersion,
  DisconnectReason
} from '@whiskeysockets/baileys'

import qrTerm from 'qrcode-terminal'
import fs from 'fs'
import path from 'path'
import { fileURLToPath, pathToFileURL } from 'url'
import { useMongoAuthState } from '../mongoAuth.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 🔥 MAPA DE COMANDOS
const commands = new Map()

// 🔥 CARGAR COMANDOS (ESM)
async function loadCommands() {
  const commandsPath = path.join(__dirname, '../commands')

  const files = fs.readdirSync(commandsPath)

  for (const file of files) {
    if (!file.endsWith('.js')) continue

    const fullPath = path.join(commandsPath, file)

    // 🔥 IMPORT DINÁMICO
    const commandModule = await import(pathToFileURL(fullPath))
    const command = commandModule.default

    if (!command?.name) {
      console.log(`❌ ${file} no tiene "name"`)
      continue
    }

    commands.set(command.name, command)
    console.log(`✅ Comando cargado: ${command.name}`)
  }
}

export async function startSocket() {

  await loadCommands() // 🔥 IMPORTANTE

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
      console.error('❌ Error en comando:', err)
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
}git add .
git commit -m "34"
git push origin main


