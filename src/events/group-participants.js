import Group from '../models/Group.js'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export function startGroupEvents(sock) {

  console.log('✅ EVENTOS CARGADOS')

  sock.ev.on('group-participants.update', async (anu) => {

    try {
      if (!['add', 'invite'].includes(anu.action)) return

      let group = await Group.findOne({ groupId: anu.id })
      if (!group) return // 🔥 IMPORTANTE

      if (!group.welcome) return

      const metadata = await sock.groupMetadata(anu.id)
      const groupName = metadata.subject

      for (const p of anu.participants) {

        const user = typeof p === 'string' ? p : p.id
        const addedBy = anu.author

        let pp
        try {
          pp = await sock.profilePictureUrl(user, 'image')
        } catch {
          pp = path.join(__dirname, '../assets/images/Bienvenida.png')
        }

        const porLink = !addedBy || addedBy === user

        const caption = `
┏━━━『 𝕱𝖊𝖑𝖇𝖔𝖙++ 』━━━┓

👤 *USER*
▸ @${user.split('@')[0]}

👥 *GROUP*
▸ ${groupName}

${porLink
? `🧬 *JOIN METHOD*
▸ Link Invitation`
: `👑 *ADDED BY*
▸ @${addedBy?.split('@')[0]}`
}

━━━━━━━━━━━━━━━━━━━
*BIENVENIDO A*  ${groupName}
*DISFRUTA TU ESTADIA* 
`.trim()

        const hour = new Date().getHours()

        let greeting
        if (hour < 12) greeting = "🌅 Good Morning"
        else if (hour < 18) greeting = "🌇 Good Afternoon"
        else greeting = "🌙 Good Night"

        const title = porLink
          ? "👥 Felbot++ • New Member"
          : "👑 Felbot++ • Member Added"

        const body = porLink
          ? `${greeting} • 🧬 Joined via Link`
          : `${greeting} • 🧬 Added by Admin`

        await sock.sendMessage(anu.id, {
          image: { url: pp },
          caption,
          mentions: porLink ? [user] : [user, addedBy].filter(Boolean),

          contextInfo: {
            externalAdReply: {
              title,
              body,
              thumbnailUrl: "https://i.pinimg.com/736x/4a/d2/63/4ad26326d288b5c78782a11ecb716a5a.jpg",
              mediaType: 1,
              renderLargerThumbnail: true
            }
          }
        })
      }

    } catch (e) {
      console.error('❌ ERROR WELCOME:', e)
    }

  })
}