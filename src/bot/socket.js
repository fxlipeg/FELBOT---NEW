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
    auth: state,
    printQRInTerminal: false,
    markOnlineOnConnect: false,
    syncFullHistory: false
  })

  sock.ev.on('creds.update', saveCreds)

  // 🔥 ESCUCHAR MENSAJES
  sock.ev.on('messages.upsert', async ({ messages }) => {
    try {
      const msg = messages[0]
      if (!msg.message) return
      if (msg.key.fromMe) return

      const from = msg.key.remoteJid

      const text =
        msg.message.conversation ||
        msg.message.extendedTextMessage?.text ||
        ''

      if (!text) return

      console.log(`📩 Comando recibido: ${text}`)

      // 👇 RESPUESTA BÁSICA
      if (text.toLowerCase() === 'hola') {
        await sock.sendMessage(from, { text: '👋 Hola, soy tu bot' })
      }

    } catch (err) {
      console.log('⚠️ Error leyendo mensaje:', err)
    }
  })

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