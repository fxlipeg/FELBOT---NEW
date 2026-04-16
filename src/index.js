import { startSocket } from './bot/socket.js'
import { startServer } from './services/web/server.js'
import { startDatabase } from './services/database/mongo.js'
import { startMessageHandler } from './handlers/messageHandler.js'
import { startGroupEvents } from './events/group-participants.js'
import ffmpeg from 'fluent-ffmpeg'
import ffmpegPath from 'ffmpeg-static'
import 'dotenv/config'

ffmpeg.setFfmpegPath(ffmpegPath)

const botStatus = { value: "INICIANDO..." }

async function startApp() {
  try {
    console.log('🚀 Iniciando bot...')

    // 🔥 1. CONECTAR MONGO PRIMERO (CLAVE)
    await startDatabase()

    // 🔥 2. LEVANTAR SERVIDOR WEB
    startServer(botStatus)

    // 🔥 3. INICIAR SOCKET (usa Mongo auth)
    const sock = await startSocket()

    // 🔥 4. EVENTOS
    startGroupEvents(sock)
    startMessageHandler(sock)

    botStatus.value = "CONECTADO"

    console.log('✅ Bot listo')

  } catch (err) {
    console.error('❌ Error al iniciar:', err)
  }
}

startApp()