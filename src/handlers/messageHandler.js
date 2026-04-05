import fs from 'fs'
import { antiLink } from '../events/antiLink.js'

const commands = new Map()

const loadCommands = async () => {
  const files = fs.readdirSync('./src/commands')

  for (const file of files) {
    try {
      const cmd = await import(`../commands/${file}`)

      if (!cmd.default || !cmd.default.name) continue

      commands.set(cmd.default.name, cmd.default)
      console.log(`✅ Comando cargado: ${cmd.default.name}`)

    } catch (err) {
      console.log(`❌ Error cargando ${file}:`, err.message)
    }
  }
}

export async function startMessageHandler(sock) {

  console.log('🧠 Handler cargado')
  await loadCommands()

  sock.ev.on('messages.upsert', async ({ messages }) => {
    if (!messages?.length) return

    const msg = messages[0]
    if (!msg.message || msg.key.fromMe) return

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
    const isGroup = from.endsWith('@g.us')

    if (isGroup) {
      await antiLink(sock, msg, text, from)
    }

    if (!text || !text.startsWith('.')) return

    const args = text.slice(1).trim().split(/ +/)
    const commandName = args.shift().toLowerCase()

    const command = commands.get(commandName)
    if (!command) return

    // 🔒 SOLO GRUPO
    if (command.groupOnly && !isGroup) {
      return sock.sendMessage(from, {
        text: '❌ Este comando solo funciona en grupos.'
      }, { quoted: msg })
    }

    // 🔒 SOLO ADMIN
    if (command.adminOnly && isGroup) {
      const metadata = await sock.groupMetadata(from)
      const sender = msg.key.participant || msg.key.remoteJid

      const isAdmin = metadata.participants.some(
        p => p.id === sender && (p.admin === 'admin' || p.admin === 'superadmin')
      )

      if (!isAdmin) {
        return sock.sendMessage(from, {
          text: '❌ Solo los administradores pueden usar este comando.'
        }, { quoted: msg })
      }
    }

    try {
      await command.execute({ sock, from, args, msg })
    } catch (err) {
      console.error(`❌ Error en ${commandName}:`, err)
    }

  })
}