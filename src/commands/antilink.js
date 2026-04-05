import Group from '../models/Group.js'

export default {
  name: 'antilink',
  groupOnly: true,
  adminOnly: true, // 🔒 SOLO ADMINS

  async execute({ sock, from, msg, args }) {
    try {

      const sender = msg.key.participant || msg.key.remoteJid
      const option = args[0]?.toLowerCase()

      let group = await Group.findOne({ groupId: from })

      if (!group) {
        group = await Group.create({
          groupId: from,
          antilink: false,
          antilinkWarnings: {},
          antilinkResetAt: 0
        })
      }

      // 🟢 ACTIVAR
      if (option === 'on') {
        group.antilink = true
        await group.save()

        return sock.sendMessage(from, {
          text: `
╭━━━〔 𝕱𝖊𝖑𝖇𝖔𝖙++ 〕━━━╮
✅ 𝗔𝗡𝗧𝗜𝗟𝗜𝗡𝗞 𝗔𝗖𝗧𝗜𝗩𝗔𝗗𝗢

🚫 Los links serán eliminados
⚠️ Sistema de advertencias activo

╰━━━━━━━━━━━━━━━━━━╯
          `.trim(),
          mentions: [sender]
        })
      }

      // 🔴 DESACTIVAR
      if (option === 'off') {
        group.antilink = false
        await group.save()

        return sock.sendMessage(from, {
          text: `
╭━━━〔 𝕱𝖊𝖑𝖇𝖔𝖙++ 〕━━━╮
❌ 𝗔𝗡𝗧𝗜𝗟𝗜𝗡𝗞 𝗗𝗘𝗦𝗔𝗖𝗧𝗜𝗩𝗔𝗗𝗢

💡 Links ahora están permitidos

╰━━━━━━━━━━━━━━━━━━╯
          `.trim(),
          mentions: [sender]
        })
      }

      // 📊 STATUS
      return sock.sendMessage(from, {
        text: `
╭━━━〔 𝕱𝖊𝖑𝖇𝖔𝖙++ 〕━━━╮
📊 𝗘𝗦𝗧𝗔𝗗𝗢 𝗔𝗡𝗧𝗜𝗟𝗜𝗡𝗞

🔒 Estado:
▸ ${group.antilink ? '🟢 ACTIVO' : '🔴 INACTIVO'}

💡 Uso:
▸ .antilink on
▸ .antilink off

╰━━━━━━━━━━━━━━━━━━╯
        `.trim()
      })

    } catch (err) {
      console.log("❌ antilink error:", err.message)

      return sock.sendMessage(from, {
        text: '❌ Error ejecutando antilink.'
      })
    }
  }
}