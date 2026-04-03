import fs from 'fs'
import path from 'path'

const commands = new Map()

// 🔥 cargar comandos (VERSIÓN PRO + SEGURA)
const loadCommands = async () => {
  const files = fs.readdirSync('./src/commands')

  for (const file of files) {
    try {
      const cmd = await import(`../commands/${file}`)

      // 🚨 validar comando
      if (!cmd.default || !cmd.default.name) {
        console.log(`❌ Comando inválido: ${file}`)
        continue
      }

      commands.set(cmd.default.name, cmd.default)
      console.log(`✅ Comando cargado: ${cmd.default.name}`)

    } catch (err) {
      console.log(`❌ Error cargando ${file}:`, err.message)
    }
  }
}

export function startMessageHandler(sock) {

  console.log('🧠 Handler cargado')

  // 🔥 cargar comandos correctamente
  loadCommands()

  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return

    const msg = messages[0]
    if (!msg.message) return
    if (msg.key.fromMe) return

    // 🧠 obtener texto universal
    const getText = (msg) => {
      const m = msg.message
      return (
        m.conversation ||
        m.extendedTextMessage?.text ||
        m.imageMessage?.caption ||
        m.videoMessage?.caption ||
        m?.ephemeralMessage?.message?.conversation ||
        m?.ephemeralMessage?.message?.extendedTextMessage?.text ||
        ''
      )
    }

    const text = getText(msg)
    const from = msg.key.remoteJid

    if (!text.startsWith('.')) return

    const args = text.slice(1).trim().split(/ +/)
    const commandName = args.shift().toLowerCase()

    const command = commands.get(commandName)

    if (!command) {
      console.log(`⚠️ Comando no encontrado: ${commandName}`)
      return
    }

    try {
      await command.execute({ sock, from, args, msg })
    } catch (err) {
      console.error(`❌ Error en comando ${commandName}:`, err)
    }
  })
}

