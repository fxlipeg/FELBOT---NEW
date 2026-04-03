import { createCanvas } from 'canvas'
import { Sticker, StickerTypes } from 'wa-sticker-formatter'

export default {
  name: "stk",

  execute: async ({ sock, from, args, msg }) => {

    try {

      if (!args.length) {
        return sock.sendMessage(from, {
          text: "❌ Usa: .stk <texto>\nEjemplo: .stk rojo hola\nEjemplo: .stk !negro blanco hola"
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

      // 🎯 detectar fondo (!color)
      if (palabras[0]?.startsWith('!')) {
        const fondo = palabras[0].slice(1).toLowerCase()
        if (colores.includes(fondo)) {
          colorFondo = fondo
          palabras.shift()
        }
      }

      // 🎯 detectar color texto
      if (colores.includes(palabras[0]?.toLowerCase())) {
        colorTexto = palabras[0].toLowerCase()
        palabras.shift()
      }

      const contenido = (palabras.join(' ') || 'Sticker').toUpperCase()

      // 🖼 canvas
      const canvas = createCanvas(512, 512)
      const ctx = canvas.getContext('2d')

      // fondo
      ctx.fillStyle = colorMap[colorFondo]
      ctx.fillRect(0, 0, 512, 512)

      // 🔥 dividir texto
      const words = contenido.split(' ')
      let lines = []
      let current = ''

      ctx.font = '60px "MontserratExtraBold"'

      for (let word of words) {
        const test = current + ' ' + word
        if (ctx.measureText(test).width < 460) {
          current = test
        } else {
          lines.push(current.trim())
          current = word
        }
      }
      if (current) lines.push(current.trim())

      // 📏 tamaño dinámico PRO
      let fontSize = Math.min(80, Math.floor(500 / (lines.length + 1)))
      ctx.font = `${fontSize}px "MontserratExtraBold"`

      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'

      // ✨ sombra pro
      ctx.shadowColor = "rgba(0,0,0,0.5)"
      ctx.shadowBlur = 10
      ctx.shadowOffsetX = 2
      ctx.shadowOffsetY = 2

      ctx.fillStyle = colorMap[colorTexto]

      // centrar
      const totalHeight = lines.length * fontSize * 1.2
      let y = (512 - totalHeight) / 2 + fontSize / 2

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