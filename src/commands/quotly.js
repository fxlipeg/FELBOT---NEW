import { createCanvas, loadImage } from 'canvas'
import fs from 'fs'
import { exec } from 'child_process'

export default {
  name: 'quotly',

  async execute({ sock, msg, args }) {
    try {
      const from = msg.key.remoteJid
      const sender = msg.key.participant || msg.key.remoteJid
      const name = msg.pushName || 'Usuario'
      const text = args.join(' ')

      if (!text) {
        return sock.sendMessage(from, {
          text: '❗ Usa: .quotly <texto>'////
        }, { quoted: msg })
      }

      let avatarUrl
      try {
        avatarUrl = await sock.profilePictureUrl(sender, 'image')
      } catch {
        avatarUrl = 'https://i.imgur.com/3GvwNBf.png'
      }

      const canvas = createCanvas(512, 512)
      const ctx = canvas.getContext('2d')

      ctx.clearRect(0, 0, 512, 512)

      // 📦 CONFIG BASE
      const bubbleX = 140
      const bubbleY = 180
      const bubbleW = 350
      const r = 35

      // 🔤 AUTO TAMAÑO SEGÚN LONGITUD
      let fontSize = 40
      if (text.length > 80) fontSize = 32
      if (text.length > 140) fontSize = 26

      ctx.font = `${fontSize}px Sans`

      const maxWidth = bubbleW - 50
      const words = text.split(' ')
      let lines = []
      let line = ''

      for (let word of words) {
        let test = line + word + ' '
        if (ctx.measureText(test).width > maxWidth) {
          lines.push(line)
          line = word + ' '
        } else {
          line = test
        }
      }
      lines.push(line)

      // 🔒 LIMITE DE LÍNEAS
      const maxLines = 4
      if (lines.length > maxLines) {
        lines = lines.slice(0, maxLines)
        lines[maxLines - 1] += '...'
      }

      // 📏 ALTURA DINÁMICA
      const lineHeight = fontSize + 8
      const paddingTop = 60
      const paddingBottom = 30

      const bubbleH = paddingTop + (lines.length * lineHeight) + paddingBottom

      // 👤 AVATAR CENTRADO
      const avatarSize = 100
      const avatarX = 30
      const avatarY = bubbleY + (bubbleH / 2) - (avatarSize / 2) - 30

      const avatar = await loadImage(avatarUrl)

      ctx.save()
      ctx.beginPath()
      ctx.arc(
        avatarX + avatarSize / 2,
        avatarY + avatarSize / 2,
        avatarSize / 2,
        0,
        Math.PI * 2
      )
      ctx.closePath()
      ctx.clip()
      ctx.drawImage(avatar, avatarX, avatarY, avatarSize, avatarSize)
      ctx.restore()

      // 🟩 BURBUJA
      ctx.fillStyle = '#000'

      ctx.beginPath()
      ctx.moveTo(bubbleX + r, bubbleY)
      ctx.lineTo(bubbleX + bubbleW - r, bubbleY)
      ctx.quadraticCurveTo(bubbleX + bubbleW, bubbleY, bubbleX + bubbleW, bubbleY + r)
      ctx.lineTo(bubbleX + bubbleW, bubbleY + bubbleH - r)
      ctx.quadraticCurveTo(bubbleX + bubbleW, bubbleY + bubbleH, bubbleX + bubbleW - r, bubbleY + bubbleH)
      ctx.lineTo(bubbleX + r, bubbleY + bubbleH)
      ctx.quadraticCurveTo(bubbleX, bubbleY + bubbleH, bubbleX, bubbleY + bubbleH - r)
      ctx.lineTo(bubbleX, bubbleY + r)
      ctx.quadraticCurveTo(bubbleX, bubbleY, bubbleX + r, bubbleY)
      ctx.fill()

      // 🏷️ NOMBRE AUTO AJUSTE
      let nameSize = 38
      if (name.length > 12) nameSize = 32
      if (name.length > 20) nameSize = 26

      ctx.fillStyle = '#ff9f43'
      ctx.font = `bold ${nameSize}px Sans`
      ctx.fillText(name, bubbleX + 25, bubbleY + 45)

      // 💬 TEXTO
      ctx.fillStyle = '#fff'
      ctx.font = `${fontSize}px Sans`

      lines.forEach((l, i) => {
        ctx.fillText(l, bubbleX + 25, bubbleY + 90 + (i * lineHeight))
      })

      // 📂 ARCHIVOS
      const file = Date.now()
      const png = `./tmp/${file}.png`
      const webp = `./tmp/${file}.webp`

      fs.writeFileSync(png, canvas.toBuffer())

      await new Promise((res, rej) => {
        exec(
          `ffmpeg -i ${png} -vcodec libwebp -filter:v "scale=512:512:force_original_aspect_ratio=increase,fps=15" -lossless 1 -q:v 90 ${webp}`,
          (e) => (e ? rej(e) : res())
        )
      })

      const sticker = fs.readFileSync(webp)

      await sock.sendMessage(from, { sticker }, { quoted: msg })

      fs.unlinkSync(png)
      fs.unlinkSync(webp)

    } catch (e) {
      console.log(e)
    }
  }
}