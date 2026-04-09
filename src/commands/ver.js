import { downloadContentFromMessage } from '@whiskeysockets/baileys'

export default {
  name: 'ver',
  alias: ['vv', 'view'],

  async execute({ sock, msg, from, reply }) {
    try {

      const context = msg.message?.extendedTextMessage?.contextInfo

      if (!context?.quotedMessage) {
        return reply('❗ Responde a una imagen o video.')
      }

      let q = context.quotedMessage

      // 🔥 quitar ephemeral si existe
      if (q.ephemeralMessage?.message) {
        q = q.ephemeralMessage.message
      }

      // 🔥 detectar media directo (NO viewOnce)
      const content =
        q.imageMessage ||
        q.videoMessage ||
        q.documentMessage ||
        q.audioMessage

      if (!content) {
        return reply('❗ Solo funciona con imágenes o videos.')
      }

      // 🔥 tipo limpio para Baileys
      let type = null

      if (q.imageMessage) type = 'image'
      else if (q.videoMessage) type = 'video'
      else return reply('❗ Solo imagen o video.')

      // 🔥 descargar media universal
      const stream = await downloadContentFromMessage(content, type)

      let buffer = Buffer.from([])

      for await (const chunk of stream) {
        buffer = Buffer.concat([buffer, chunk])
      }

      if (!buffer.length) {
        return reply('❌ No se pudo obtener el archivo.')
      }

      // 🔥 reenviar limpio
      if (type === 'image') {
        await sock.sendMessage(from, {
          image: buffer,
          caption: '👁️ Vista recuperada'
        }, { quoted: msg })
      }

      if (type === 'video') {
        await sock.sendMessage(from, {
          video: buffer,
          caption: '👁️ Vista recuperada'
        }, { quoted: msg })
      }

    } catch (err) {
      console.error('VER ERROR:', err)
      reply('💥 Error al procesar el mensaje.')
    }
  }
}