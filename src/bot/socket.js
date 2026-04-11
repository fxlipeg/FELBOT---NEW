import makeWASocket, {
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  DisconnectReason
} from '@whiskeysockets/baileys'

import qrTerm from 'qrcode-terminal'

// 🔥 IMPORTS CON TU RUTA REAL
import { cleanAuth } from '../src/commands/authCleaner.js'
import { backupAuth } from '../src/commands/authBackup.js'

// 🧹 limpiar auth al iniciar
cleanAuth()

export async function startSocket() {
  const { state, saveCreds } = await useMultiFileAuthState('./auth')
  const { version } = await fetchLatestBaileysVersion()

  const sock = makeWASocket({
    version,
    auth: state,
    printQRInTerminal: false
  })

  // 💾 guardar + backup automático
  sock.ev.on('creds.update', () => {
    saveCreds()
    backupAuth()
  })

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update

    // 📲 QR (solo si no hay sesión)
    if (qr) {
      console.log('📲 Escanea el QR:')
      qrTerm.generate(qr, { small: true })
    }

    // ✅ conectado
    if (connection === 'open') {
      console.log('✅ BOT CONECTADO')
    }

    // ❌ desconectado
    if (connection === 'close') {
      const code = lastDisconnect?.error?.output?.statusCode

      console.log('❌ Conexión cerrada:', code)

      const shouldReconnect = code !== DisconnectReason.loggedOut

      if (shouldReconnect) {
        console.log('🔁 Reconectando...')
        startSocket()
      } else {
        console.log('🚫 Sesión cerrada, necesitas QR')
      }
    }
  })

  return sock
}