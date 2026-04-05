import { checkCooldown } from "../utils/cooldown.js";

export default {
  name: "n",
  cooldown: 20000, // ⏱️ aquí defines el tiempo

  execute: async ({ sock, from, msg }) => {
    try {
      const sender = msg.key.participant || msg.key.remoteJid

      // ⏱️ cooldown Mongo
      const cd = await checkCooldown(sender, from, "n", 20000)

      if (cd.active) {
        return await sock.sendMessage(from, {
          text: `╭━━━〔 ⏳ 𝕮𝖔𝖔𝖑𝖉𝖔𝖜𝖓 〕━━━╮
┃ Espera *${cd.remaining}s*
┃ antes de usar *.n*
╰━━━━━━━━━━━━━━━╯`
        }, { quoted: msg })
      }

      // 🔥 reacción
      await sock.sendMessage(from, {
        react: {
          text: "📢",
          key: msg.key
        }
      })

      // 🧠 texto
      const quoted = msg.message?.extendedTextMessage?.contextInfo
      const mentionedMessage = quoted?.quotedMessage

      const getText = (m) => {
        return (
          m?.conversation ||
          m?.extendedTextMessage?.text ||
          m?.imageMessage?.caption ||
          m?.videoMessage?.caption ||
          ''
        )
      }

      const text = mentionedMessage
        ? getText(mentionedMessage)
        : getText(msg.message).slice(2).trim()

      if (!text) return

      // 👥 grupo
      const groupMetadata = await sock.groupMetadata(from)
      const participants = groupMetadata.participants.map(p => p.id)

      const invisibleText = `\u200E`.repeat(1000)

      // 🖼️ mensaje bonito
      await sock.sendMessage(from, {
        text: `
 ${text}` + invisibleText,
        mentions: participants,
        contextInfo: {
          externalAdReply: {
            title: "𝕱𝖊𝖑𝖇𝖔𝖙",
            body: "Sistema de notificaciones",
            thumbnailUrl: "https://i.pinimg.com/736x/4a/d2/63/4ad26326d288b5c78782a11ecb716a5a.jpg",
            mediaType: 1,
            renderLargerThumbnail: true
          }
        }
      }, { quoted: msg })

    } catch (e) {
      console.error(e)

      await sock.sendMessage(from, {
        text: "❌ Error en comando .n"
      }, { quoted: msg })
    }
  }
}