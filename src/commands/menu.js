import fs from 'fs'
import path from 'path'

function formatUptime(seconds) {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  return `${h}h ${m}m ${s}s`
}

export default {
  name: 'menu',

  execute: async ({ sock, from, msg }) => {

    const uptime = formatUptime(process.uptime())
    const version = '2.0' // ✅ AQUÍ SE DEFINE

    const video = fs.readFileSync(
      path.resolve('src/assets/gifs/menu/menu.mp4')
    )

    const texto = `
╭━〔 𝐌𝐄𝐍𝐔 - 𝐅𝐄𝐋𝐁𝐎𝐓 夜 〕━╮
┃ ✦ Canal: ✧ FELBOT 夜 | Oficial ✧
┃ 👑 Creador: Fxlipe 夜
┃ ⚙️ Versión : v${version}
┃ ⏳ Uptime: ${uptime}
╰━━━━━━━━━━━━━╯

┏━✦「 🎮 𝐃𝐈𝐕𝐄𝐑𝐒𝐈𝐎𝐍 」✦━┓
⪼ .chupador   » Random divertido
⪼ .top        » Ranking random
⪼ .pregunta   » Respuestas IA
⪼ .besar @    » Acción beso
⪼ .follar @   » Acción +18
┗━━━━━━━━━━━━━┛


┏✦「 🤖 𝐈𝐍𝐓𝐄𝐋𝐈𝐆𝐄𝐍𝐂𝐈𝐀 」✦┓
⪼ .ai          » Chat IA
⪼ .traductor   » Traducir texto
⪼ .voice       » Texto a voz
┗━━━━━━━━━━━━━┛


┏━✦「 📥 𝐃𝐄𝐒𝐂𝐀𝐑𝐆𝐀𝐒 」✦━┓
⪼ .tt          » Descargar TikTok
┗━━━━━━━━━━━━━┛


┏「 🖼️ 𝐒𝐓𝐈𝐂𝐊𝐄𝐑𝐒 & 𝐌𝐄𝐃𝐈𝐀 」┓
⪼ .stk        » Crear sticker
⪼ .s          » Foto/Video → Sticker
⪼ .wm         » Poner watermark
⪼ .ver        » Ver Media 1vszn
⪼ .quotly     » Stiker (negro)
┗━━━━━━━━━━━━━┛


┏━✦「 👥 𝐆𝐄𝐒𝐓𝐈𝐎𝐍 」✦━┓
⪼ .mencion     » Mencionar todos
⪼ .n           » @ + mensaje
⪼ .add [n°]    » Agregar usuario
⪼ .kick @      » Expulsar
⪼ .admin @     » Dar admin
⪼ .unadmin @   » Quitar admin
⪼ .kill        » Kick random
⪼ .autoadmin   » Auto admin
⪼ .mute        » Mutear User
⪼ .unmute      » Desmutear user
┗━━━━━━━━━━━━━┛


┏━✦「 🛡️ 𝐒𝐄𝐆𝐔𝐑𝐈𝐃𝐀𝐃 」✦━┓
⪼ .estado         » Info del grupo
⪼ .welcome on/off » Bienvenida
⪼ .antilink on/off» Anti enlaces
⪼ .modoadmin      » Solo admins
⪼ .cerrar         » Cerrar grupo
⪼ .abrir          » Abrir grupo
⪼ .eliminar       » Borrar mensaje
┗━━━━━━━━━━━━━┛


┏━✦「 🔥 𝐅𝐑𝐄𝐄 𝐅𝐈𝐑𝐄 」✦━┓
⪼ .2vs2  » Sala 2v2
⪼ .4vs4  » Sala 4v4
⪼ .6vs6  » Sala 6v6
⪼ .int2  » Interna 2v2
⪼ .int4  » Interna 4v4
⪼ .int6  » Interna 6v6
┗━━━━━━━━━━━━━┛


┏━✦「 📜 𝐄𝐗𝐓𝐑𝐀𝐒 」✦━┓
⪼ .reglascmp   » Ver reglas
⪼ .owner    » Info owner
⪼ .lid      » Lid user
⪼ .ping     » Velocidad bot
┗━━━━━━━━━━━━━┛


┏━✦「 ⚡ 𝐒𝐈𝐒𝐓𝐄𝐌𝐀 」✦━┓
⪼ .menu   » Mostrar menú
┗━━━━━━━━━━━━━┛

✦〔 ⚡ FELBOT 夜 v${version} ⚡ 〕✦
 FELBOT • POWERED BY Fxlipe 夜 
✦━━━━━━━━━━━━✦
`

    await sock.sendMessage(from, {
      video: video,
      gifPlayback: true,
      caption: texto,
      contextInfo: {
        forwardingScore: 999,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
          newsletterJid: '1203630XXXXXXX@newsletter',
          newsletterName: '✧ FELBOT 夜 | Oficial Channel ✧',
        }
      }
    }, { quoted: msg })

  }
}