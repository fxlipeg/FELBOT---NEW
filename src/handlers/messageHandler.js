import fs from 'fs'
import { antiLink } from '../events/antiLink.js'
import { modoAdmin } from '../events/modoadmin.js'
import { handleReaccion } from '../commands/vs.js'
import { handleTres, handleMove } from '../commands/tres.js'

// 🔇 MUTE GLOBAL
global.muted = global.muted || {}

// 🔥 ANTI DUPLICADOS
const processedMessages = new Set()

// 📦 COMANDOS
const commands = new Map()

const loadCommands = async () => {
  const files = fs.readdirSync('./src/commands')

  for (const file of files) {
    try {
      const cmd = await import(`../commands/${file}`)
      const data = cmd.default

      if (!data?.name || typeof data.execute !== 'function') continue

      if (Array.isArray(data.name)) {
        data.name.forEach(n => commands.set(n.toLowerCase(), data))
      } else {
        commands.set(data.name.toLowerCase(), data)
      }

    } catch {}
  }
}

export async function startMessageHandler(sock) {

  await loadCommands()

  sock.ev.on('messages.upsert', async ({ messages }) => {
    try {
      if (!messages?.length) return

      const msg = messages[0]
      if (!msg.message || msg.key.fromMe) return

      const msgId = msg.key.id

      // 🔁 ANTI DUPLICADOS
      if (processedMessages.has(msgId)) return
      processedMessages.add(msgId)

      setTimeout(() => {
        processedMessages.delete(msgId)
      }, 5000)

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

      // 🔇 MUTE
      if (isGroup && global.muted[from]?.includes(sender)) {
        try {
          await sock.sendMessage(from, {
            delete: {
              remoteJid: from,
              fromMe: false,
              id: msg.key.id,
              participant: sender
            }
          })
        } catch {}
        return
      }

      // ⚡ REACCIONES / JUEGOS
      try { await handleReaccion(sock, msg, from) } catch {}
      try { await handleTres(sock, msg, from) } catch {}
      try { await handleMove(sock, msg, text, from) } catch {}

      let metadata = null
      let participants = []
      let isAdmin = false
      let isBotAdmin = false
      let isOwner = false

      if (isGroup) {
        try {
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
        } catch {}
      }

      // 👑 OWNER
      const owners = ['573001234567']
      isOwner = owners.includes(clean(sender))

      // 🔥 EVENTOS
      if (isGroup) {
        try { await antiLink(sock, msg, text, from) } catch {}

        try {
          const stop = await modoAdmin(sock, msg, text, from)
          if (stop === true) return
        } catch {}
      }

      // ❌ SIN COMANDO
      if (!text || !text.startsWith('.')) return

      const args = text.slice(1).trim().split(/ +/)
      const commandName = args.shift()?.toLowerCase()
      if (!commandName) return

      const command = commands.get(commandName)
      if (!command || typeof command.execute !== 'function') return

      // 💬 RESPUESTA SEGURA
      const reply = async (txt, mentions = []) => {
        try {
          await sock.sendMessage(from, {
            text: txt,
            mentions
          }, { quoted: msg })
        } catch {}
      }

      // 🔒 VALIDACIONES
      if (command.groupOnly && !isGroup) return reply('❌ Solo en grupos.')
      if (command.adminOnly && !isAdmin) return reply('❌ Solo admins.')
      if (command.botAdmin && !isBotAdmin) return reply('❌ El bot necesita admin.')
      if (command.ownerOnly && !isOwner) return reply('❌ Solo el owner.')

      // 🚀 EJECUCIÓN
      try {
        await command.execute({
          sock,
          from,
          args,
          msg,
          text,
          command: commandName,
          isGroup,
          isAdmin,
          isBotAdmin,
          isOwner,
          participants,
          metadata,
          sender,
          reply
        })
      } catch {}

    } catch {}
  })
}