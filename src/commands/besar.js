import fs from 'fs'
import path from 'path'

export default {
  name: 'besar',

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
        text: '❌ Menciona a alguien para besar 😏'
      }, { quoted: msg })
    }

    const sender = msg.key.participant || msg.key.remoteJid
    const target = mentioned[0]

    // 🚫 evitar auto-beso 💀
    if (sender === target) {
      return sock.sendMessage(from, {
        text: '🤨 ¿Besarte a ti mismo? Respétate JAJA'
      }, { quoted: msg })
    }

    // 🚫 evitar besar al bot
    if (target === sock.user.id) {
      return sock.sendMessage(from, {
        text: '😳 Yo no me dejo tan fácil...'
      }, { quoted: msg })
    }

    // 💬 frases mejoradas
    const frases = [
      '💋 le dio un beso apasionado a',
      '😘 besó suavemente a',
      '😏 le robó un beso a',
      '🔥 besó intensamente a',
      '🥵 no pudo resistirse y besó a',
      '💞 le plantó un beso inesperado a',
      '😳 terminó besando a',
      '💥 sin aviso besó a'
    ]

    const frase = frases[Math.floor(Math.random() * frases.length)]

    // 🎬 gifs random desde carpeta
    const folder = path.resolve('src/assets/gifs/besar')
    const files = fs.readdirSync(folder)
    const randomGif = files[Math.floor(Math.random() * files.length)]
    const gif = fs.readFileSync(path.join(folder, randomGif))

    // 💬 mensaje bonito
    const texto = `
╭━━━〔 💋 BESAR 〕━━━⬣

@${sender.split('@')[0]} ${frase} @${target.split('@')[0]}

╰━━━━━━━━━━━━━━━━━━⬣
`.trim()

    // 📤 enviar gif
    await sock.sendMessage(from, {
      video: gif,
      gifPlayback: true,
      caption: texto,
      mentions: [sender, target]
    }, { quoted: msg })

    // ⚡ reacción
    await sock.sendMessage(from, {
      react: { text: '💋', key: msg.key }
    })
  }
}