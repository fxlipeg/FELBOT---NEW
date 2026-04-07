const cooldown = new Map()

export default {
  name: 'mencion',

  async execute({ sock, from, msg }) {
    try {
      if (!from.endsWith('@g.us')) {
        return sock.sendMessage(from, {
          text: '❌ Este comando solo funciona en grupos.'
        })
      }

      const sender = msg.key.participant || msg.key.remoteJid

      // ⏱️ COOLDOWN
      const now = Date.now()
      const tiempo = 10000

      if (cooldown.has(from)) {
        const expira = cooldown.get(from)
        if (now < expira) {
          const restante = ((expira - now) / 1000).toFixed(1)
          return sock.sendMessage(from, {
            text: `⏳ Espera ${restante}s`
          })
        }
      }

      cooldown.set(from, now + tiempo)

      // 📊 Grupo
      const metadata = await sock.groupMetadata(from)
      const participantes = metadata.participants
      const mentions = participantes.map(p => p.id)

      // 🕒 Saludo
      const hour = new Date().getHours()
      let greeting
      if (hour < 12) greeting = "🌅 Buenos días"
      else if (hour < 18) greeting = "🌇 Buenas tardes"
      else greeting = "🌙 Buenas noches"

      // 📝 TEXTO LINEAL
      const texto = `
✦━━━〔  *MENCION*  〕━━━✦
📢 *Mencionando a todos*

👑 *Solicitado por:* @${sender.split('@')[0]}
🥷 *Grupo:* ${metadata.subject}
🧩 *Miembros:* ${participantes.length}

✦━━━━━━━━━━✦
${participantes.map(p => `➤ @${p.id.split('@')[0]}`).join('\n')}
✦━━━━━━━✦
      `.trim()

      await sock.sendMessage(from, {
        text: texto,
        mentions,

        contextInfo: {
          externalAdReply: {
            title: "✨ Felbot++ • Mención General",
            body: `${greeting} • 🚀 Notificando a todos`,
            thumbnailUrl: "https://i.pinimg.com/736x/4a/d2/63/4ad26326d288b5c78782a11ecb716a5a.jpg",
            mediaType: 1,
            renderLargerThumbnail: true
          }
        }
      })

    } catch (error) {
      console.error(error)
      sock.sendMessage(from, {
        text: '❌ Error al ejecutar el comando.'
      })
    }
  }
}