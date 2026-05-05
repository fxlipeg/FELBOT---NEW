import makeWASocket, {
  fetchLatestBaileysVersion,
  DisconnectReason
} from '@whiskeysockets/baileys'

import { useMongoAuthState } from '../mongoAuth.js'
import { startMessageHandler } from '../handlers/messageHandler.js'

let sock = null
let isConnecting = false

export async function startSocket() {

  // 🚫 EVITA MULTI INSTANCIAS
  if (isConnecting) {
    console.log('⚠️ Ya se está conectando, evitando duplicado...')
    return
  }

  if (sock) {
    console.log('⚠️ Ya existe un socket activo')
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

  // 🔑 PAIRING CODE (reemplaza QR)
  if (!sock.authState.creds.registered) {
    const numero = '212693891790' // 👈 tu número sin + ni espacios

    try {
      const code = await sock.requestPairingCode(numero)

      console.log('\n🔑 CÓDIGO DE VINCULACIÓN:')
      console.log(code)
      console.log('📱 WhatsApp > Dispositivos vinculados > Ingresar código\n')
    } catch (err) {
      console.error('❌ Error generando código:', err)
    }
  }

  // 💾 GUARDAR SESIÓN
  sock.ev.on('creds.update', saveCreds)

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect } = update

    if (connection === 'open') {
      console.log('✅ CONECTADO')
      isConnecting = false

      // 🧠 SOLO UNA VEZ
      startMessageHandler(sock)
    }

    if (connection === 'close') {
      const statusCode = lastDisconnect?.error?.output?.statusCode

      console.log(`❌ Conexión cerrada: ${statusCode}`)

      sock = null
      isConnecting = false

      // 🚫 NO RECONEXIÓN EN CONFLICTO
      if (statusCode === 440) {
        console.log('🚫 conflicto → NO reconectar')
        return
      }

      if (statusCode === DisconnectReason.loggedOut) {
        console.log('🚫 sesión cerrada → usa pairing code')
        return
      }

      // ✅ RECONEXIÓN CONTROLADA
      console.log('🔄 Reconectando en 5s...')
      setTimeout(() => startSocket(), 5000)
    }
  })

  return sock
}