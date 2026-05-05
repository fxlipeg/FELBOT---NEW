export default {
  name: ["abrir", "cerrar"],

  async execute({ sock, from, msg, command, isAdmin, isGroup, reply }) {

    if (!isGroup) return reply('💬 Este comando solo funciona en grupos.')
    if (!isAdmin) return reply('🔒 Solo admins pueden usar este comando.')

    // 📛 Nombre del grupo
    const metadata = await sock.groupMetadata(from)
    const groupName = metadata.subject

    // 🕒 ESTILO (igual que usas)
    const hour = new Date().getHours()

    let greeting
    if (hour < 12) greeting = "👑 Gestiones"
    else if (hour < 18) greeting = "👑 Gestiones"
    else greeting = "👑 Gestiones"

    // 🔓 ABRIR
    if (command === "abrir") {

      await sock.groupSettingUpdate(from, 'not_announcement')

      const texto = `
🔓 *GRUPO ABIERTO*
═══════════════════════
📛 ${groupName}


chat ha sido habilitado
para todos los miembros.
`

      await sock.sendMessage(from, {
        text: texto,

        contextInfo: {
          externalAdReply: {
            title: "👥 Felbot++ • Group Open",
            body: `${greeting} • Sistema de Grupo`,
            thumbnailUrl: "https://i.pinimg.com/736x/4a/d2/63/4ad26326d288b5c78782a11ecb716a5a.jpg",
            mediaType: 1,
            renderLargerThumbnail: true
          }
        }

      }, { quoted: msg })

      await sock.sendMessage(from, {
        react: {
          text: '🔓',
          key: msg.key
        }
      })
    }

    // 🔒 CERRAR
    if (command === "cerrar") {

      await sock.groupSettingUpdate(from, 'announcement')

      const texto = `
🔒 *GRUPO CERRADO*
═══════════════════════
📛 ${groupName}

🚫 Solo los administradores
pueden enviar mensajes.
`

      await sock.sendMessage(from, {
        text: texto,

        contextInfo: {
          externalAdReply: {
            title: "⚠️ Felbot++ • Group Closed",
            body: `${greeting} • Sistema de Grupo`,
            thumbnailUrl: "https://i.pinimg.com/736x/4a/d2/63/4ad26326d288b5c78782a11ecb716a5a.jpg",
            mediaType: 1,
            renderLargerThumbnail: true
          }
        }

      }, { quoted: msg })

      await sock.sendMessage(from, {
        react: {
          text: '🔒',
          key: msg.key
        }
      })
    }
  }
}