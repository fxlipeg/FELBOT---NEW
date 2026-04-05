import Group from '../models/Group.js'

export async function modoAdmin(sock, msg, text, from) {
  try {
    if (!text.startsWith('.')) return

    const group = await Group.findOne({ groupId: from })
    if (!group?.modoadmin) return

    const sender = msg.key.participant || msg.key.remoteJid

    const metadata = await sock.groupMetadata(from)
    const admins = metadata.participants
      .filter(p => p.admin)
      .map(p => p.id)

    if (!admins.includes(sender)) {

      await sock.sendMessage(from, {
        text: `
┏━━━『 𝕱𝖊𝖑𝖇𝖔𝖙++ 』━━━┓
🔒 *Modo Admin Activado*

❌ No puedes usar comandos
porque no eres admin
┗━━━━━━━━━━━━━━━━┛
        `.trim()
      })

      return true
    }

  } catch (err) {
    console.log(err)
  }
}