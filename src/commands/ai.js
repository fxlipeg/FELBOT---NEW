import { preguntarIA } from '../services/ia/ia.js'
//
export default {
  name: 'ai',

  execute: async ({ sock, from, msg }) => {

    const getText = (msg) => {
      const m = msg.message
      return (
        m?.conversation ||
        m?.extendedTextMessage?.text ||
        m?.imageMessage?.caption ||
        m?.videoMessage?.caption ||
        m?.ephemeralMessage?.message?.conversation ||
        m?.ephemeralMessage?.message?.extendedTextMessage?.text ||
        ''
      )
    }

    const fullText = getText(msg)
    const pregunta = fullText.replace(/^\.ai\s*/i, '').trim()

    if (!pregunta) {
      return sock.sendMessage(from, {
        text: '¿Y la pregunta qué? No soy adivino 💀'
      }, { quoted: msg })
    }

    const userId = msg.key.participant || msg.key.remoteJid

    try {
      const respuesta = await preguntarIA(userId, pregunta)

      await sock.sendMessage(from, {
        text: `😒 ${respuesta}`
      }, { quoted: msg })

    } catch (err) {
      console.error(err)

      await sock.sendMessage(from, {
        text: 'Se jodió la IA 😑'
      }, { quoted: msg })
    }
  }
}