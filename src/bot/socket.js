import makeWASocket, {
  fetchLatestBaileysVersion,
  DisconnectReason
} from '@whiskeysockets/baileys'

import qrTerm from 'qrcode-terminal'
import { useMongoAuthState } from '../mongoAuth.js'
import Session from '../models/session.js'
import { startMessageHandler } from '../handlers/messageHandler.js'

// 🔥 CONTROL GLOBAL
let sock = null
let isStarting = false
let isConnected = false

export async function startSocket() {

  // 🛑 evitar duplicados
  if (sock && isConnected) {
    console.log('🟢 Socket ya activo, no se crea otro')
    return sock
  }

  if (isStarting) {
    console.log('⏳ Socket en proceso...')
    return
  }

  isStarting = true

  const { state, saveCreds } = await useMongoAuthState()
  const { version } = await fetchLatestBaileysVersion()

  const newSock = makeWASocket({
    version,
    auth: state,
    printQRInTerminal: false,
    markOnlineOnConnect: false
  })

  sock = newSock

  newSock.ev.on('creds.update', saveCreds)

  newSock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update

    if (qr) {
      console.log('📲 Escanea QR:')
      qrTerm.generate(qr, { small: true })
    }

    if (connection === 'open') {
      console.log('✅ CONECTADO')

      isConnected = true
      isStarting = false

      await startMessageHandler(newSock)
    }

    if (connection === 'close') {
      const code = lastDisconnect?.error?.output?.statusCode

      console.log('❌ Conexión cerrada:', code)

      isConnected = false

      // 🔴 SESIÓN INVÁLIDA
      if (code === 401) {
        console.log('🧹 sesión inválida → borrando auth')

        await Session.deleteOne({ _id: 'auth' })

        sock = null
        isStarting = false

        return setTimeout(() => startSocket(), 3000)
      }

      // 🟡 CONFLICT (NO BUCLE)
      if (code === 440) {
        console.log('⚠️ conflicto detectado')

        // esperar a ver si hay socket vivo
        setTimeout(() => {
          if (!sock || !isConnected) {
            console.log('🔄 no hay socket activo → reconectando')
            sock = null
            isStarting = false
            startSocket()
          } else {
            console.log('🟢 otro socket ya está activo, no hago nada')
          }
        }, 8000)

        return
      }

      // 🔁 RECONEXIÓN NORMAL
      console.log('🔄 reconexión normal...')

      sock = null
      isStarting = false

      setTimeout(() => startSocket(), 5000)
    }
  })

  return sock
}