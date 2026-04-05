import { createCanvas, registerFont } from 'canvas'
import { Sticker, StickerTypes } from 'wa-sticker-formatter'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

// 📌 ruta segura
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// 🎨 font
registerFont(
  resolve(__dirname, '../utils/Happyweek/Happyweek.otf'),
  {
    family: 'Happyweek'
  }
)

export default {
  name: "stk",

  execute: async ({ sock, from, args, msg }) => {

    try {

      if (!args.length) {
        return sock.sendMessage(from, {
          text: "❌ Usa: .stk <texto>\nEjemplo: .stk hola\nEjemplo: .stk rojo hola mundo"
        }, { quoted: msg })
      }

      await sock.sendMessage(from, {
        react: { text: "🎨", key: msg.key }
      })

      // 🎨 colores
      const colorMap = {
        rojo: '#ff0000',
        azul: '#0000ff',
        verde: '#00ff00',
        negro: '#000000',
        amarillo: '#ffff00',
        morado: '#800080',
        rosado: '#ff69b4',
        naranja: '#ffa500',
        blanco: '#ffffff'
      }

      const colores = Object.keys(colorMap)

      let palabras = [...args]

      let colorTexto = 'negro'
      let colorFondo = 'blanco'

      // 🎯 fondo (!color)
      if (palabras[0]?.startsWith('!')) {
        const fondo = palabras[0].slice(1).toLowerCase()
        if (colores.includes(fondo)) {
          colorFondo = fondo
          palabras.shift()
        }
      }

      // 🎯 color texto
      if (colores.includes(palabras[0]?.toLowerCase())) {
        colorTexto = palabras[0].toLowerCase()
        palabras.shift()
      }

      // 🧠 texto final con soporte de saltos
      const contenido = (palabras.join(' ') || 'Sticker').toUpperCase()

      // 📌 soporte líneas manuales
      const lines = contenido.split('\n')

      // 🖼 canvas
      const canvas = createCanvas(512, 512)
      const ctx = canvas.getContext('2d')

      // fondo
      ctx.fillStyle = colorMap[colorFondo]
      ctx.fillRect(0, 0, 512, 512)

      // 🔤 font base
      let fontSize = 90
      ctx.font = `${fontSize}px "Happyweek"`

      // 🔥 auto resize inteligente
      while (fontSize > 20) {
        let maxWidth = 0

        for (let line of lines) {
          const width = ctx.measureText(line).width
          if (width > maxWidth) maxWidth = width
        }

        if (maxWidth <= 460) break

        fontSize -= 2
        ctx.font = `${fontSize}px "Happyweek"`
      }

      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'

      // ✨ sombra pro
      ctx.shadowColor = "rgba(0,0,0,0.5)"
      ctx.shadowBlur = 10
      ctx.shadowOffsetX = 2
      ctx.shadowOffsetY = 2

      ctx.fillStyle = colorMap[colorTexto]

      // 📍 centrado perfecto vertical
      const totalHeight = lines.length * fontSize * 1.2
      let y = (512 - totalHeight) / 2 + fontSize / 2

      // 🖊 dibujar líneas
      for (let line of lines) {
        ctx.fillText(line, 256, y)
        y += fontSize * 1.2
      }

      // 🧾 sticker
      const buffer = canvas.toBuffer('image/png')

      const sticker = new Sticker(buffer, {
        pack: 'FELBOT',
        author: '夜',
        type: StickerTypes.FULL,
        quality: 100
      })

      const stickerBuffer = await sticker.toBuffer()

      await sock.sendMessage(from, {
        sticker: stickerBuffer
      }, { quoted: msg })

    } catch (err) {
      console.error("❌ ERROR STK:", err)

      await sock.sendMessage(from, {
        text: "💀 No pude crear el sticker"
      }, { quoted: msg })
    }
  }
}