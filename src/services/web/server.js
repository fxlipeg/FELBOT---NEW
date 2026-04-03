import express from 'express'
import axios from 'axios'

export function startServer(botStatus) {
  const app = express()

  app.get('/', (req, res) => {
    res.send(`
      <h1>🤖 FELBOT</h1>
      <p>Estado: ${botStatus.value}</p>
    `)
  })

  const PORT = process.env.PORT || 3000

  app.listen(PORT, () => {
    console.log('🌐 Servidor web activo en puerto', PORT)
  })

  // auto ping (como tu ya tenías)
  setInterval(async () => {
    try {
      await axios.get("https://felbot-new.onrender.com")
    } catch {}
  }, 4 * 60 * 1000)
}