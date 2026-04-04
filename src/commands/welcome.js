import Group from '../models/Group.js'

export default {
  name: 'welcome',
  category: 'grupo',
  groupOnly: true,
  adminOnly: true,

  async execute({ sock, from, args, msg }) {

    const reply = (text) =>
      sock.sendMessage(from, { text }, { quoted: msg })

    let group = await Group.findOne({ groupId: from })
    if (!group) group = await new Group({ groupId: from }).save()

    const option = args[0]?.toLowerCase()

    if (!option) {
      return reply(`
┏━━━『 𝕱𝖊𝖑𝖇𝖔𝖙++ 』━━━┓
⚙️ Sistema de Bienvenida

▸ .welcome on
▸ .welcome off
┗━━━━━━━━━━━━━━━━┛
      `.trim())
    }

    if (option === 'on') {
      group.welcome = true
      await group.save()

      return reply(`
┏━━━『 𝕱𝖊𝖑𝖇𝖔𝖙++ 』━━━┓
✅ 𝗕𝗜𝗘𝗡𝗩𝗘𝗡𝗜𝗗𝗔 𝗔𝗖𝗧𝗜𝗩𝗔𝗗𝗔

🧠 El sistema de bienvenida
ha sido encendido correctamente.
┗━━━━━━━━━━━━━━━━┛
      `.trim())
    }

    if (option === 'off') {
      group.welcome = false
      await group.save()

      return reply(`
┏━━━『 𝕱𝖊𝖑𝖇𝖔𝖙++ 』━━━┓
❌ 𝗕𝗜𝗘𝗡𝗩𝗘𝗡𝗜𝗗𝗔 𝗗𝗘𝗦𝗔𝗖𝗧𝗜𝗩𝗔𝗗𝗔

🧠 El sistema de bienvenida
ha sido apagado en este grupo.
┗━━━━━━━━━━━━━━━━┛
      `.trim())
    }

  }
}