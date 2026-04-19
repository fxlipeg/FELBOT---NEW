import makeWASocket, {
  fetchLatestBaileysVersion,
  DisconnectReason
} from '@whiskeysockets/baileys'

import qrTerm from 'qrcode-terminal'
import { useMongoAuthState } from '../mongoAuth.js'
import Session from '../models/session.js'
import { startMessageHandler } from '../handlers/messageHandler.js'

// 🔥 SINGLETON GLOBAL
let sock = null
let starting = false

export async function startSocket() {

  // 🛑 evitar múltiples sockets
  if (sock) {
    console.log('⚠️ Socket ya activo')
    return sock
  }

  if (starting) {
    console.log('⏳ Socket en proceso...')
    return
  }

  starting = true

  const { state, saveCreds } = await useMongoAuthState()
  const { version } = await fetchLatestBaileysVersion()

  sock = makeWASocket({
    version,
    auth: state,
    printQRInTerminal: false,
    markOnlineOnConnect: false
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

      // 🔥 handler SOLO UNA VEZ
      await startMessageHandler(sock)

      starting = false
    }

    if (connection === 'close') {
      const code = lastDisconnect?.error?.output?.statusCode

      console.log('❌ Conexión cerrada:', code)

      // 🔴 SESIÓN INVALIDA → NUEVO QR
      if (code === 401) {
        await Session.deleteOne({ _id: 'auth' })
        console.log('🧹 sesión eliminada → nuevo QR')
        sock = null
        starting = false
        return startSocket()
      }

      // 🔴 CONFLICT → NO RECONEXIÓN
      if (code === 440) {
        console.log('🚫 conflicto detectado → evitando reconexión')
        sock = null
        starting = false
        return
      }

      // 🔁 reconexión normal
      console.log('🔄 reconectando...')
      sock = null
      starting = false

      setTimeout(() => startSocket(), 5000)
    }
  })

  return sock
}