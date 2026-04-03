export default {
  name: 'top',

  execute: async ({ sock, from, args, msg }) => {

    // ❌ solo grupos
    if (!from.endsWith('@g.us')) {
      return sock.sendMessage(from, {
        text: '❌ Solo funciona en grupos'
      }, { quoted: msg })
    }

    // 📌 categoría
    const categoria = args.join(' ')
    if (!categoria) {
      return sock.sendMessage(from, {
        text: '❌ Usa: .top (ejemplo: .top inteligentes)'
      }, { quoted: msg })
    }

    // 👥 participantes
    const metadata = await sock.groupMetadata(from)

    let participants = metadata.participants
      .map(p => p.id)

      // 🔥 evitar bot
      .filter(id => id !== sock.user.id)

      // 🔥 excluir número opcional
      .filter(id => id !== '573117354305@s.whatsapp.net')

    // 🎲 shuffle real
    for (let i = participants.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[participants[i], participants[j]] = [participants[j], participants[i]]
    }

    // 🏆 top 5
    const top5 = participants.slice(0, 5)

    const emojis = ['🥇', '🥈', '🥉', '🏅', '🎖️']

    // 💬 mensaje limpio
    let message = `
╭━━━〔 🔝 TOP 5 〕━━━⬣

✨ *LOS MÁS ${categoria.toUpperCase()}* ✨

`.trim()

    top5.forEach((user, index) => {
      message += `\n${emojis[index]} *Top ${index + 1}* ➤ @${user.split('@')[0]}`
    })

    message += `

╰━━━━━━━━━━━━━━━━━━⬣
🔥 *ABSOLUTOS GANADORES*
`

    // 📤 enviar
    await sock.sendMessage(from, {
      text: message,
      mentions: top5
    }, { quoted: msg })

    // ⚡ reacción
    await sock.sendMessage(from, {
      react: { text: '🔥', key: msg.key }
    })
  }
}