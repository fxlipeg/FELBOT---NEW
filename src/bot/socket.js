import makeWASocket, {
  fetchLatestBaileysVersion,
  DisconnectReason
} from '@whiskeysockets/baileys'

import { useMongoAuthState } from '../mongoAuth.js'
import { startMessageHandler } from '../handlers/messageHandler.js'
import qrcode from 'qrcode-terminal'

let sock = null
let isConnecting = false

export async function startSocket() {

  if (isConnecting) {
    console.log('⚠️ Ya se está conectando...')
    return
  }

  if (sock) {
    console.log('⚠️ Socket ya existe')
    return
  }

  isConnecting = true

  const { state, saveCreds } = await useMongoAuthState()
  const { version } = await fetchLatestBaileysVersion()

  sock = makeWASocket({
    version,
    auth: state,
    browser: ['Ubuntu', 'Chrome', '20.0.04']
  })

  sock.ev.on('creds.update', saveCreds)

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect, qr } = update

    // 🔥 MOSTRAR QR
    if (qr) {
      console.log('\n📱 ESCANEA ESTE QR:\n')
      qrcode.generate(qr, { small: true })
    }

    if (connection === 'open') {
      console.log('✅ CONECTADO')
      isConnecting = false

      startMessageHandler(sock)
    }

    if (connection === 'close') {
      const statusCode = lastDisconnect?.error?.output?.statusCode

      console.log(`❌ Conexión cerrada: ${statusCode}`)

      sock = null
      isConnecting = false

      if (statusCode === 440) {
        console.log('🚫 conflicto → NO reconectar')
        return
      }

      if (statusCode === DisconnectReason.loggedOut) {
        console.log('🚫 sesión cerrada → vuelve a escanear QR')
        return
      }

      console.log('🔄 Reconectando en 5s...')
      setTimeout(() => startSocket(), 5000)
    }
  })

  return sock
}