import googleTTS from "google-tts-api"
import fs from "fs"
import path from "path"
import { exec } from "child_process"

export default {
  name: "voice",

  execute: async ({ sock, from, args, msg }) => {

    if (!args.length) {
      return sock.sendMessage(from, {
        text: "❌ Usa: .voice <texto>"
      }, { quoted: msg })
    }

    try {
      await sock.sendMessage(from, {
        react: { text: "🎙️", key: msg.key }
      })

      let lang = "es"
      const idiomas = ["es", "en", "pt", "fr", "it", "de", "ja"]

      if (idiomas.includes(args[0]?.toLowerCase())) {
        lang = args.shift().toLowerCase()
      }

      const texto = args.join(" ").trim()

      const tmpMp3 = `./tmp/${Date.now()}.mp3`
      const tmpOgg = `./tmp/${Date.now()}.ogg`

      if (!fs.existsSync("./tmp")) fs.mkdirSync("./tmp")

      // 🔊 descargar mp3
      const url = googleTTS.getAudioUrl(texto.slice(0, 180), { lang })
      const res = await fetch(url)
      const buffer = Buffer.from(await res.arrayBuffer())

      fs.writeFileSync(tmpMp3, buffer)

      // 🔥 convertir a formato REAL WhatsApp
      await new Promise((resolve, reject) => {
        exec(`ffmpeg -i ${tmpMp3} -vn -c:a libopus -b:a 128k ${tmpOgg}`, (err) => {
          if (err) reject(err)
          else resolve()
        })
      })

      // 📤 enviar
      await sock.sendMessage(from, {
        audio: fs.readFileSync(tmpOgg),
        mimetype: "audio/ogg; codecs=opus",
        ptt: true
      }, { quoted: msg })

      // 🧹 limpiar
      fs.unlinkSync(tmpMp3)
      fs.unlinkSync(tmpOgg)

    } catch (err) {
      console.error("🔥 ERROR VOICE:", err)

      await sock.sendMessage(from, {
        text: "💀 Error generando audio"
      }, { quoted: msg })
    }
  }
}