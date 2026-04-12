import fs from 'fs'
import makeWASocket, { useMultiFileAuthState, fetchLatestBaileysVersion, DisconnectReason } from '@whiskeysockets/baileys'
import qrTerm from 'qrcode-terminal'

export async function startSocket() {

  const authPath = './auth'

  // 🔥 VERIFICAR AUTH
  if (!fs.existsSync(authPath)) {
    console.log('❌ NO EXISTE AUTH → se generará nueva sesión')
  } else {
    console.log('📁 AUTH ENCONTRADA → usando sesión guardada')
  }

  const { state, saveCreds } = await useMultiFileAuthState(authPath)
  const { version } = await fetchLatestBaileysVersion()

  const sock = makeWASocket({
    version,
    auth: state
  })

  sock.ev.on('creds.update', saveCreds)

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update

    if (qr) {
      console.log('📲 Escanea el QR:')
      qrTerm.generate(qr, { small: true })
    }

    if (connection === 'open') {
      console.log('✅ CONECTADO USANDO AUTH')
    }

    if (connection === 'close') {
      const code = lastDisconnect?.error?.output?.statusCode

      console.log('❌ Conexión cerrada:', code)

      const shouldReconnect = code !== DisconnectReason.loggedOut

      if (shouldReconnect) {
        console.log('🔁 Reconectando...')
        startSocket()
      } else {
        console.log('🚫 Sesión inválida, QR requerido')
      }
    }
  })

  return sock
}