import makeWASocket, {
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  DisconnectReason
} from '@whiskeysockets/baileys'

import qrTerm from 'qrcode-terminal'
import { cleanAuth } from './authCleaner.js'
import { backupAuth } from './authBackup.js'

// 🔥 LIMPIAR AL INICIO
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

    if (qr) {
      console.log('📲 Escanea QR:')
      qrTerm.generate(qr, { small: true })
    }

    if (connection === 'open') {
      console.log('✅ BOT ONLINE')
    }

    if (connection === 'close') {
      const code = lastDisconnect?.error?.output?.statusCode

      const reconnect = code !== DisconnectReason.loggedOut

      if (reconnect) {
        console.log('🔁 Reconectando...')
        startSocket()
      } else {
        console.log('🚫 Sesión perdida (nuevo QR)')
      }
    }
  })

  return sock
}