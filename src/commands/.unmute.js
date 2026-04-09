const muted = global.muted || (global.muted = {})

export default {
  name: 'unmute',
  adminOnly: true,
  groupOnly: true,

  async execute({ sock, from, msg }) {

    const ctx = msg.message?.extendedTextMessage?.contextInfo

    let user

    if (ctx?.mentionedJid?.length) {
      user = ctx.mentionedJid[0]
    } else if (ctx?.participant) {
      user = ctx.participant
    } else {
      return
    }

    if (!muted[from]) return

    muted[from] = muted[from].filter(u => u !== user)

    const number = user.split('@')[0]

    await sock.sendMessage(from, {
      text: `🔊 Usuario @${number} desmuteado`,
      mentions: [user]
    }, { quoted: msg })
  }
}