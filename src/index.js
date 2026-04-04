import { startSocket } from './bot/socket.js'
import { startServer } from './services/web/server.js'
import { startDatabase } from './services/database/mongo.js'
import { startMessageHandler } from './handlers/messageHandler.js'
import { startGroupEvents } from './events/group-participants.js'
import 'dotenv/config'


const botStatus = { value: "INICIANDO..." }

async function startApp() {
  console.log('🚀 Iniciando bot...')

  await startDatabase()

  startServer(botStatus)

  const sock = await startSocket()
  
startGroupEvents(sock) 

 startMessageHandler(sock) 

  botStatus.value = "CONECTADO"

  console.log('✅ Bot listo')
}

startApp()