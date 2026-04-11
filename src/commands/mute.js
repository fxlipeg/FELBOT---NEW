const muted = global.muted || (global.muted = {})

const protectedIds = [
  '573001234567',
  '274517599482100',
  '71713186422948',
  '83073928568937',
  '199583456067718',
  '112490277032179'
]

export default {
  name: 'mute',
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
      return sock.sendMessage(from, {
        text: '⚠️ Menciona o responde a alguien.'
      }, { quoted: msg })
    }

    const sender = msg.key.participant || msg.key.remoteJid
    const senderNumber = sender.split('@')[0]
    const targetNumber = user.split('@')[0]

    if (!muted[from]) muted[from] = []

    // 💀 ANTI-MUTE PRO
    if (protectedIds.includes(targetNumber)) {

      // mutear al que intentó
      if (!muted[from].includes(sender)) {
        muted[from].push(sender)
      }

      await sock.sendMessage(from, {
        text: `💀 Intentaste mutear a un moderador de Felbot...\n🔇 Ahora estás muteado @${senderNumber}`,
        mentions: [sender]
      }, { quoted: msg })

      return
    }

    // ✅ MUTE NORMAL
    if (!muted[from].includes(user)) {
      muted[from].push(user)
    }

    await sock.sendMessage(from, {
      text: `🔇 Usuario @${targetNumber} muteado correctamente`,
      mentions: [user]
    }, { quoted: msg })
  }
}