export default {
  name: "unadmin",

  async execute({ sock, from, msg, sender, isAdmin, isGroup, reply }) {

    if (!isGroup) return reply('💬 Este comando solo funciona en grupos.')
    if (!isAdmin) return reply('🔒 Solo admins pueden usar este comando.')

    const mentionedJid = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || []

    if (mentionedJid.length === 0) {
      return reply(
`❗ Debes mencionar a un usuario.

Ejemplo:
.unadmin @usuario`
      )
    }

    const target = mentionedJid[0]

    await sock.groupParticipantsUpdate(from, [target], 'demote')

    // 🕒 ESTILO (igual al tuyo)
    const hour = new Date().getHours()

    let greeting
    if (hour < 12) greeting = "😾 User"
    else if (hour < 18) greeting = "😾 User"
    else greeting = "😾 User"

    // 🧾 MENSAJE
    const msgAdmin = `
🚫 *ADMIN REMOVIDO*
═══════════════════════
👻 *Usuario:* @${target.split('@')[0]}
═══════════════════════
👑 *Removido por:* @${sender.split('@')[0]}
`

    await sock.sendMessage(from, {
      text: msgAdmin,
      mentions: [target, sender],

      contextInfo: {
        externalAdReply: {
          title: "⚠️ Felbot++ • Admin Update",
          body: `${greeting} • Sistema Admin`,
          thumbnailUrl: "https://i.pinimg.com/736x/4a/d2/63/4ad26326d288b5c78782a11ecb716a5a.jpg",
          mediaType: 1,
          renderLargerThumbnail: true
        }
      }

    }, {
      quoted: msg
    })

    // 🚫 REACCIÓN
    await sock.sendMessage(from, {
      react: {
        text: '🚫',
        key: msg.key
      }
    })
  }
}