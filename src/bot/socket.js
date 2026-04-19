import makeWASocket, {
  fetchLatestBaileysVersion,
  DisconnectReason
} from '@whiskeysockets/baileys'

import qrTerm from 'qrcode-terminal'
import { useMongoAuthState } from '../mongoAuth.js'
import Session from '../models/session.js'

// 👇 IMPORTA TU HANDLER
import { startMessageHandler } from '../handlers/messageHandler.js'

let reconnecting = false

export async function startSocket() {

  const { state, saveCreds } = await useMongoAuthState()
  const { version } = await fetchLatestBaileysVersion()

  const sock = makeWASocket({
    version,
    auth: state,
    printQRInTerminal: false
  })

  sock.ev.on('creds.update', saveCreds)

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update

    if (qr) {
      console.log('📲 Escanea QR:')
      qrTerm.generate(qr, { small: true })
    }

    if (connection === 'open') {
      console.log('✅ CONECTADO')

      // 🔥 ARRANCA TU BOT
      await startMessageHandler(sock)

      reconnecting = false
    }

    if (connection === 'close') {
      const code = lastDisconnect?.error?.output?.statusCode
      console.log('❌ Conexión cerrada:', code)

      // 🔥 sesión rota → regenerar QR
      if (code === 401) {
        await Session.deleteOne({ _id: 'auth' })
        console.log('🧹 sesión eliminada → escanea QR')
        return startSocket()
      }

      // 🚫 conflicto
      if (code === 440) {
        console.log('🚫 sesión reemplazada (conflict)')
        return
      }

      if (reconnecting) return
      reconnecting = true

      console.log('🔄 reconectando...')
      setTimeout(() => startSocket(), 3000)
    }
  })

  return sock
}