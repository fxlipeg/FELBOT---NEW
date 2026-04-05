import Group from '../models/Group.js'

export default {
  name: 'modoadmin',

  async execute({ sock, from, msg, args }) {
    try {
      if (!from.endsWith('@g.us')) return

      const sender = msg.key.participant || msg.key.remoteJid

      const metadata = await sock.groupMetadata(from)
      const admins = metadata.participants
        .filter(p => p.admin)
        .map(p => p.id)

      // ❌ solo admins
      if (!admins.includes(sender)) {
        return sock.sendMessage(from, {
          text: '❌ Solo los administradores pueden usar este comando.'
        })
      }

      let group = await Group.findOne({ groupId: from })
      if (!group) group = new Group({ groupId: from })

      const option = args[0]?.toLowerCase()

      // 📋 MENÚ
      if (!option) {
        return sock.sendMessage(from, {
          text: `
┏━━━『 𝕱𝖊𝖑𝖇𝖔𝖙++ 』━━━┓
⚙️ Sistema Modo Admin

▸ .modoadmin on
▸ .modoadmin off
┗━━━━━━━━━━━━━━━━┛
          `.trim()
        })
      }

      // ✅ ACTIVAR
      if (option === 'on') {
        group.modoadmin = true
        await group.save()

        return sock.sendMessage(from, {
          text: `
┏━━━『 𝕱𝖊𝖑𝖇𝖔𝖙++ 』━━━┓
✅ *MODO ADMIN ACTIVADO*

🔒 Solo administradores
pueden usar comandos
┗━━━━━━━━━━━━━━━━┛
          `.trim()
        })
      }

      // ❌ DESACTIVAR
      if (option === 'off') {
        group.modoadmin = false
        await group.save()

        return sock.sendMessage(from, {
          text: `
┏━━━『 𝕱𝖊𝖑𝖇𝖔𝖙++ 』━━━┓
❌ *MODO ADMIN DESACTIVADO*

🔓 Todos pueden usar comandos
┗━━━━━━━━━━━━━━━━┛
          `.trim()
        })
      }

    } catch (err) {
      console.log(err)
    }
  }
}