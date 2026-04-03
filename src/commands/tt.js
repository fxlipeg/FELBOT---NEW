import axios from "axios"

export default {
  name: "tt",

  execute: async ({ sock, from, args, msg }) => {

    const url = args[0]

    if (!url || !url.includes("tiktok.com")) {
      return sock.sendMessage(from, {
        text: "⚠️ Ingresa un link válido de TikTok\nEjemplo: .tt https://vm.tiktok.com/xxxxx/"
      }, { quoted: msg })
    }

    try {
      await sock.sendMessage(from, {
        react: { text: "⏳", key: msg.key }
      })

      let video = null

      // 🔥 API 1
      try {
        const res1 = await axios.get(`https://api.tiklydown.eu.org/api/download?url=${url}`, {
          timeout: 10000
        })
        video = res1.data?.video?.noWatermark
        if (video) console.log("✅ API 1 OK")
      } catch {
        console.log("❌ API 1 falló")
      }

      // 🔥 API 2
      if (!video) {
        try {
          const res2 = await axios.post("https://tikwm.com/api/", {
            url
          }, {
            timeout: 10000,
            headers: {
              "Content-Type": "application/json"
            }
          })
          video = res2.data?.data?.play
          if (video) console.log("✅ API 2 OK")
        } catch {
          console.log("❌ API 2 falló")
        }
      }

      // 🔥 API 3
      if (!video) {
        try {
          const res3 = await axios.get(`https://api.douyin.wtf/api?url=${url}`, {
            timeout: 10000
          })
          video = res3.data?.video
          if (video) console.log("✅ API 3 OK")
        } catch {
          console.log("❌ API 3 falló")
        }
      }

      if (!video) {
        return sock.sendMessage(from, {
          text: "❌ No pude obtener el video 😔"
        }, { quoted: msg })
      }

      // 🚀 enviar video
      await sock.sendMessage(from, {
        video: { url: video },
        caption: "🔥 Video sin marca de agua"
      }, { quoted: msg })

      await sock.sendMessage(from, {
        react: { text: "🔥", key: msg.key }
      })

    } catch (err) {
      console.error("❌ ERROR TT:", err)

      await sock.sendMessage(from, {
        text: "💀 Error procesando el video"
      }, { quoted: msg })
    }
  }
}