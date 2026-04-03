import fs from 'fs'
import path from 'path'

export default {
  name: 'chupador',

  execute: async ({ sock, from, msg }) => {

    if (!from.endsWith('@g.us')) {
      return sock.sendMessage(from, {
        text: '❌ Solo funciona en grupos'
      }, { quoted: msg })
    }

    const metadata = await sock.groupMetadata(from)

    // 🔥 evitar elegir el bot
    const participants = metadata.participants.filter(
      p => p.id !== sock.user.id
    )

    const randomUser = participants[Math.floor(Math.random() * participants.length)]
    const user = randomUser.id
    const nombre = user.split('@')[0]

    // 🎬 gifs random
    const folder = path.resolve('src/assets/gifs/chupador')
    const files = fs.readdirSync(folder)
    const randomGif = files[Math.floor(Math.random() * files.length)]
    const gif = fs.readFileSync(path.join(folder, randomGif))

    // 🔥 frases random
    const frases = [
      'no hay discusión, ganó por goleada 💀',
      'esto ya era obvio desde hace rato 😮‍💨',
      'orgullo nacional 🇨🇴',
      'nadie le compite JAJAJA',
      'el talento no se esconde 😈',
      'campeón invicto 🏆'
    ]

    const frase = frases[Math.floor(Math.random() * frases.length)]

    // 💬 mensaje mejorado
    const texto = `
╭━〔 🔥 𝑭𝒆𝒍𝒃𝒐𝒕 𝑨𝒘𝒂𝒓𝒅𝒔 🔥 〕━⬣

🏆 *EL MÁS CHUPADOR DEL GRUPO*

👑 @${nombre}

💬 ${frase}

╰━━━━━━━━━━━━━━━━━━━━⬣
`.trim()

    // 🎬 GIF (modo whatsapp)
    await sock.sendMessage(from, {
      video: gif,
      gifPlayback: true,
      caption: texto,
      mentions: [user]
    }, { quoted: msg })

    // ⚡ reacción
    await sock.sendMessage(from, {
      react: { text: '🍆', key: msg.key }
    })
  }
}