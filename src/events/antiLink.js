import Group from '../models/Group.js'

export async function antiLink(sock, msg, text, from) {
  try {

    if (!from.endsWith('@g.us')) return

    const group = await Group.findOne({ groupId: from })
    if (!group || !group.antilink) return

    const sender = msg.key.participant || msg.key.remoteJid
    if (!sender) return

    const metadata = await sock.groupMetadata(from)

    // 🔥 EXCEPCIÓN ADMIN
    const isAdmin = metadata.participants.find(p => p.id === sender)?.admin
    if (isAdmin) return

    const linkRegex = /https?:\/\/|www\.|chat\.whatsapp\.com/gi
    if (!linkRegex.test(text)) return

    // 🧠 init DB
    if (!group.antilinkWarnings) group.antilinkWarnings = {}
    if (!group.antilinkResetAt) group.antilinkResetAt = 0

    const now = Date.now()

    // ⏳ reset 24h
    if (now - group.antilinkResetAt >= 86400000) {
      group.antilinkWarnings = {}
      group.antilinkResetAt = now
    }

    if (!group.antilinkWarnings[sender]) {
      group.antilinkWarnings[sender] = 0
    }

    group.antilinkWarnings[sender]++
    const count = group.antilinkWarnings[sender]

    await group.save()

    // 🗑 borrar mensaje
    await sock.sendMessage(from, {
      delete: msg.key
    })

    // 🚨 EXPULSIÓN
    if (count >= 3) {

      await sock.sendMessage(from, {
        text: `
🚫 USER REMOVED

👤 @${sender.split('@')[0]}
⚠️ 3/3 AntiLink warnings
        `.trim(),
        mentions: [sender]
      })

      await sock.groupParticipantsUpdate(from, [sender], 'remove')

      delete group.antilinkWarnings[sender]
      await group.save()

      return
    }

    // ⚠️ WARNING
    await sock.sendMessage(from, {
      text: `
⚠️ LINK WARNING

👤 @${sender.split('@')[0]}
📊 ${count}/3
      `.trim(),
      mentions: [sender]
    })

  } catch (err) {
    console.log('AntiLink error:', err.message)
  }
}