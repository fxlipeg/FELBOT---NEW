import fs from 'fs'
import { antiLink } from '../events/antiLink.js'
import { modoAdmin } from '../events/modoadmin.js'
import { handleReaccion } from '../commands/vs.js'

const commands = new Map()

const loadCommands = async () => {
  const files = fs.readdirSync('./src/commands')

  for (const file of files) {
    try {
      const cmd = await import(`../commands/${file}`)

      if (!cmd.default || !cmd.default.name) continue

      if (Array.isArray(cmd.default.name)) {
        for (const name of cmd.default.name) {
          commands.set(name, cmd.default)
          console.log(`✅ Comando cargado: ${name}`)
        }
      } else {
        commands.set(cmd.default.name, cmd.default)
        console.log(`✅ Comando cargado: ${cmd.default.name}`)
      }

    } catch (err) {
      console.log(`❌ Error cargando ${file}:`, err.message)
    }
  }
}

export async function startMessageHandler(sock) {

  console.log('🧠 Handler ULTRA PRO cargado')
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
    const sender = msg.key.participant || msg.key.remoteJid

    const clean = (jid) => jid?.split('@')[0]

    // 🔥 REACCIONES
    await handleReaccion(sock, msg, from)

    let metadata = null
    let participants = []
    let isAdmin = false
    let isBotAdmin = false
    let isOwner = false

    if (isGroup) {
      metadata = await sock.groupMetadata(from)
      participants = metadata.participants

      const senderData = participants.find(p => clean(p.id) === clean(sender))
      const botData = participants.find(p => clean(p.id) === clean(sock.user.id))

      isAdmin =
        senderData?.admin === 'admin' ||
        senderData?.admin === 'superadmin'

      isBotAdmin =
        botData?.admin === 'admin' ||
        botData?.admin === 'superadmin'
    }

    // 👑 OWNER (pon tu número aquí)
    const owners = ['573001234567']
    isOwner = owners.includes(clean(sender))

    // 🔥 EVENTOS
    if (isGroup) {
      await antiLink(sock, msg, text, from)
      const stop = await modoAdmin(sock, msg, text, from)
      if (stop) return
    }

    if (!text || !text.startsWith('.')) return

    const args = text.slice(1).trim().split(/ +/)
    const commandName = args.shift().toLowerCase()

    console.log("📩 Comando recibido:", commandName)

    const command = commands.get(commandName)
    if (!command) return

    const reply = (txt, mentions = []) =>
      sock.sendMessage(from, {
        text: txt,
        mentions
      }, { quoted: msg })

    // 🔒 SOLO GRUPO
    if (command.groupOnly && !isGroup) {
      return reply('❌ Este comando solo funciona en grupos.')
    }

    // 🔒 SOLO ADMIN
    if (command.adminOnly && !isAdmin) {
      return reply('❌ Solo los administradores pueden usar este comando.')
    }

    // 🔒 BOT ADMIN
    if (command.botAdmin && !isBotAdmin) {
      return reply('❌ El bot necesita ser administrador.')
    }

    // 👑 SOLO OWNER
    if (command.ownerOnly && !isOwner) {
      return reply('❌ Solo el owner puede usar este comando.')
    }

    try {
      await command.execute({
        sock,
        from,
        args,
        msg,
        text,
        command: commandName,

        // 🔥 PODER TOTAL
        isGroup,
        isAdmin,
        isBotAdmin,
        isOwner,
        participants,
        metadata,
        sender,

        reply // 💬 respuesta rápida citando
      })
    } catch (err) {
      console.error(`❌ Error en ${commandName}:`, err)
      reply('❌ Error al ejecutar el comando.')
    }

  })
}