import makeWASocket, {
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  DisconnectReason
} from '@whiskeysockets/baileys'

import qrTerm from 'qrcode-terminal'
import fs from 'fs'
import AdmZip from 'adm-zip'

const SESSION_PATH = './auth'

// 🔥 RECONSTRUIR SESIÓN DESDE ENV
if (process.env.SESSION) {
  try {
    if (!fs.existsSync(SESSION_PATH)) {
      fs.mkdirSync(SESSION_PATH)
    }

    const buffer = Buffer.from(process.env.SESSION, 'base64')
    fs.writeFileSync('./auth.zip', buffer)

    const zip = new AdmZip('./auth.zip')
    zip.extractAllTo(SESSION_PATH, true)

    console.log('✅ Sesión cargada desde variables de entorno')
  } catch (err) {
    console.log('❌ Error cargando sesión:', err)
  }
}

export async function startSocket() {
  const { state, saveCreds } = await useMultiFileAuthState(SESSION_PATH)
  const { version } = await fetchLatestBaileysVersion()

  const sock = makeWASocket({
    version,
    auth: state,
    printQRInTerminal: false
  })

  // 🔐 Guardar credenciales automáticamente
  sock.ev.on('creds.update', saveCreds)

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update

    // 📲 Mostrar QR solo si no hay sesión
    if (qr) {
      console.log('📲 Escanea el QR:')
      qrTerm.generate(qr, { small: true })
    }

    // ✅ Conectado
    if (connection === 'open') {
      console.log('✅ Conectado a WhatsApp')
    }

    // ❌ Desconectado
    if (connection === 'close') {
      const code = lastDisconnect?.error?.output?.statusCode

      console.log('❌ Conexión cerrada:', code)

      const shouldReconnect = code !== DisconnectReason.loggedOut

      if (shouldReconnect) {
        console.log('🔁 Reconectando...')
        startSocket()
      } else {
        console.log('🚫 Sesión cerrada, necesitas nuevo QR')
      }
    }
  })

  return sock
}