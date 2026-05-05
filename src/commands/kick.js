export default {
  name: 'kick',
  groupOnly: true,
  adminOnly: true,

  async execute({ sock, from, msg, reply, participants }) {
    try {
      const react = (emoji) =>
        sock.sendMessage(from, {
          react: { text: emoji, key: msg.key }
        })

      const context = msg.message?.extendedTextMessage?.contextInfo

      if (!context?.mentionedJid || context.mentionedJid.length === 0) {
        return reply('❗ *Menciona al usuario que quieres expulsar*')
      }

      const target = context.mentionedJid[0]
      const botId = sock.user.id.split('@')[0]

      // 🚫 Evitar bot
      if (target.includes(botId)) {
        return reply('🤖 *No puedo expulsarme a mí mismo*')
      }

      // 🚫 Evitar admins
      const isTargetAdmin = participants.find(p => p.id === target)?.admin
      if (isTargetAdmin) {
        return reply('⚠️ *No puedes expulsar a otro admin*')
      }

      const mencion = [target]

      // 👢 Kick
      await sock.groupParticipantsUpdate(from, [target], 'remove')

      await react('👢')

      const executor = msg.key.participant || msg.key.remoteJid

      // 🕒 Saludo (lo dejé como tú lo usas)
      const hour = new Date().getHours()
      let greeting

      if (hour < 12) greeting = "Moderacion"
      else if (hour < 18) greeting = "Moderacion"
      else greeting = "Moderacion"

      // 🎴 TARJETA PRO
      await sock.sendMessage(from, {
        text:
`> ☠️ 𝕰𝖝𝖕𝖚𝖑𝖘𝖎ó𝖓

┏━[ 👢 𝕱𝖊𝖑𝖇𝖔𝖙++ 𝕸𝖔𝖉𝖊𝖗𝖆𝖈𝖎ó𝖓 ]━┓
┃
┃ 💀 Usuario expulsado del grupo
┃ ⚖️ Acción ejecutada correctamente
┃
┃ 🐵 Usuario: @${target.split('@')[0]}
┃ 👤 Admin: @${executor.split('@')[0]}
┃ 📤 Acción: Kick
┃
┗━━━━━━━━━━━━━━━━━━━━━━━┛`,
        mentions: [target, executor],

        contextInfo: {
          externalAdReply: {
            title: "👢 Felbot++ • Moderación",
            body: `${greeting} • Usuario expulsado`,
            thumbnailUrl: "https://i.pinimg.com/736x/90/67/6e/90676e6d9d9f2c6b9d8e7c7b6d5a1234.jpg",
            mediaType: 1,
            renderLargerThumbnail: true
          }
        }

      }, { quoted: msg })

    } catch (error) {
      console.error('❌ Error en kick:', error)
      reply('❌ Error al ejecutar el kick.')
    }
  }
}