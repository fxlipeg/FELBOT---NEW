import makeWASocket, {
  fetchLatestBaileysVersion,
  DisconnectReason
} from '@whiskeysockets/baileys'

import { useMongoAuthState } from '../mongoAuth.js'
import { startMessageHandler } from '../handlers/messageHandler.js'

let sock = null
let isConnecting = false
let waitingForPairing = false // 🔥 clave

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

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect } = update

    // 🔑 GENERAR CÓDIGO SOLO UNA VEZ Y EN EL MOMENTO CORRECTO
    if (!sock.authState.creds.registered && !waitingForPairing) {
      waitingForPairing = true

      try {
        const numero = '212693891790'

        const code = await sock.requestPairingCode(numero)

        console.log('\n🔑 CÓDIGO DE VINCULACIÓN:')
        console.log(code)
        console.log('📱 WhatsApp > Dispositivos vinculados > Ingresar código\n')
        console.log('⏳ Esperando que ingreses el código...')

      } catch (err) {
        console.error('❌ Error generando código:', err.message)
      }
    }

    if (connection === 'open') {
      console.log('✅ CONECTADO')
      isConnecting = false
      waitingForPairing = false

      startMessageHandler(sock)
    }

    if (connection === 'close') {
      const statusCode = lastDisconnect?.error?.output?.statusCode

      console.log(`❌ Conexión cerrada: ${statusCode}`)

      sock = null
      isConnecting = false

      // 🔥 SI ESTÁS EN LOGIN → NO REINICIAR
      if (waitingForPairing) {
        console.log('⏳ Esperando login, NO reconectar...')
        return
      }

      if (statusCode === 440) {
        console.log('🚫 conflicto → NO reconectar')
        return
      }

      if (statusCode === DisconnectReason.loggedOut || statusCode === 401) {
        console.log('🔑 sesión inválida → reinicia para nuevo código')
        waitingForPairing = false
        return
      }

      console.log('🔄 Reconectando en 5s...')
      setTimeout(() => startSocket(), 5000)
    }
  })

  return sock
}