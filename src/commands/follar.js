import fs from 'fs'
import path from 'path'

export default {
  name: 'follar',

  execute: async ({ sock, from, msg }) => {

    // ❌ solo grupos
    if (!from.endsWith('@g.us')) {
      return sock.sendMessage(from, {
        text: '❌ Solo funciona en grupos'
      }, { quoted: msg })
    }

    // 👥 mencionados
    const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid

    if (!mentioned || mentioned.length === 0) {
      return sock.sendMessage(from, {
        text: '❌ Menciona a alguien 😏'
      }, { quoted: msg })
    }

    const sender = msg.key.participant || msg.key.remoteJid
    const target = mentioned[0]

    // 🚫 evitar auto
    if (sender === target) {
      return sock.sendMessage(from, {
        text: '🤨 ¿Qué haces bro? JAJA'
      }, { quoted: msg })
    }

    // 🚫 evitar al bot
    if (target === sock.user.id) {
      return sock.sendMessage(from, {
        text: '😳 conmigo no...'
      }, { quoted: msg })
    }

    // 💬 frases
    const frases = [
      '🔥 se volvió loco con',
      '😈 tuvo una noche intensa con',
      '🥵 no se aguantó con',
      '💦 terminó encima de',
      '😏 se descontroló con'
    ]

    const frase = frases[Math.floor(Math.random() * frases.length)]

    // 🎬 gifs desde carpeta
    const folder = path.resolve('src/assets/gifs/follar')
    const files = fs.readdirSync(folder)
    const randomGif = files[Math.floor(Math.random() * files.length)]
    const gif = fs.readFileSync(path.join(folder, randomGif))

    // 💬 mensaje
    const texto = `
╭━━━〔 😈 FOLLAR 〕━━━⬣

@${sender.split('@')[0]} ${frase} @${target.split('@')[0]}

╰━━━━━━━━━━━━━━━━━━⬣
`.trim()

    // 📤 enviar
    await sock.sendMessage(from, {
      video: gif,
      gifPlayback: true,
      caption: texto,
      mentions: [sender, target]
    }, { quoted: msg })

    // ⚡ reacción
    await sock.sendMessage(from, {
      react: { text: '😈', key: msg.key }
    })
  }
}