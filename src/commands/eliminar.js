export default {
  name: 'eliminar',
  groupOnly: true,
  adminOnly: true,

  async execute({ sock, from, msg, reply }) {
    try {
      const react = (emoji) =>
        sock.sendMessage(from, {
          react: { text: emoji, key: msg.key }
        })

      const context = msg.message?.extendedTextMessage?.contextInfo

      if (!context?.stanzaId) {
        return reply('❗ *Debes responder al mensaje que quieres eliminar*')
      }

      const participante = context.participant
      const mencion = participante ? [participante] : []

      // 🗑️ Eliminar mensaje
      await sock.sendMessage(from, {
        delete: {
          remoteJid: from,
          fromMe: false,
          id: context.stanzaId,
          participant: context.participant
        }
      })

      await react('❌')

      // 🕒 Saludo dinámico
      const hour = new Date().getHours()
      let greeting

      if (hour < 12) greeting = "Moderacion"
      else if (hour < 18) greeting = "Moderacion"
      else greeting = "Moderacion"

      // 🎴 MENSAJE CON TARJETA
      await sock.sendMessage(from, {
        text:
`> ⚠️ 𝕬𝖉𝖛𝖊𝖗𝖙𝖊𝖓𝖈𝖎𝖆

┏━━━[ ⚠️ 𝕱𝖊𝖑𝖇𝖔𝖙++ 𝕸𝖔𝖉𝖊𝖗𝖆𝖈𝖎ó𝖓 ]━┓
┃
┃ 🚫 ¡𝕸𝖊𝖓𝖘𝖆𝖏𝖊 𝖓𝖔 𝖕𝖊𝖗𝖒𝖎𝖙𝖎𝖉𝖔!
┃ 🧠 Detalles: Violaste las reglas.
┃
┃ 🐵 Usuario: @${participante?.split('@')[0]}
┃ 📤 Acción: Mensaje eliminado
┃
┗━━━━━━━━━━━━━━━━━━━━━━━┛`,
        mentions: mencion,

        contextInfo: {
          externalAdReply: {
            title: "⚠️ Felbot++ • Moderación",
            body: `${greeting} • 🚫 Mensaje eliminado`,
            thumbnailUrl: "https://i.pinimg.com/736x/4a/d2/63/4ad26326d288b5c78782a11ecb716a5a.jpg",
            mediaType: 1,
            renderLargerThumbnail: true
          }
        }

      }, { quoted: msg })

    } catch (error) {
      console.error('❌ Error en eliminar:', error)
      reply('❌ Error al eliminar el mensaje.')
    }
  }
}