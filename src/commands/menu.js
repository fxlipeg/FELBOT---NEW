import fs from 'fs'
import path from 'path'

export default {
  name: 'menu',

  execute: async ({ sock, from, msg }) => {

    let groupName = 'Privado'

    if (from.endsWith('@g.us')) {
      try {
        const metadata = await sock.groupMetadata(from)
        groupName = metadata.subject || 'Grupo'
      } catch {}
    }

    // 🔥 única imagen
    const img = fs.readFileSync(
      path.resolve('src/assets/images/menu.png')
    )

    const texto = `
🌸✨✧ 𝐌𝐄𝐍𝐔 – 𝐆𝐫𝐮𝐩𝐨: ${groupName} ✧✨🌸

┏━✦「 🎮 𝐃𝐢𝐯𝐞𝐫𝐬𝐢𝐨́𝐧 」✦━┓
⪼ .chupador   » Random divertido
⪼ .top (...)  » Los más ...
⪼ .pregunta   » Pregunta al bot
⪼ .besar @     » Besar user
⪼ .follar @   » Follar user
┗━━━━━━━━━━━━━━━━━━┛

┏━✦「 🤖 𝐈𝐧𝐭𝐞𝐥𝐢𝐠𝐞𝐧𝐜𝐢𝐚 」✦━┓
⪼ .traductor » Inglés ⇄ Español
⪼ .ai           » IA integrada
⪼ .voice      » Texto → Audio
┗━━━━━━━━━━━━━━━━━━┛

┏━✦「 📥 𝐃𝐞𝐬𝐜𝐚𝐫𝐠𝐚𝐬 」✦━┓
⪼ .tt          » Video tiktok
┗━━━━━━━━━━━━━━━━━━┛

┏✦「 🖼️ 𝐒𝐭𝐢𝐜𝐤𝐞𝐫𝐬 & 𝐌𝐞𝐝𝐢𝐚 」✦┓
⪼ .stk        » Crear sticker
⪼ .fts        » Foto/Video → Sticker
⪼ .wm          » WaterMark
┗━━━━━━━━━━━━━━━━━━┛

┏━✦「 ⚙️ 𝐆𝐞𝐧𝐞𝐫𝐚𝐥𝐞𝐬 」✦━┓
⪼ .compe      » Compe externo
⪼ .interna     » Internas del grupo
⪼ .vv2          » VV2 del grupo
⪼ .intvv2      » Interna VV2
⪼ .info         » Info del bot
⪼ .mencion    » Menciona a todos
┗━━━━━━━━━━━━━━━━━━┛

┏✦「 🧠 𝐀𝐝𝐦𝐢𝐧𝐢𝐬𝐭𝐫𝐚𝐜𝐢ó𝐧 」✦┓
⪼ .estado   » Estado del grupo
⪼ .panel    » Estado del bot
┗━━━━━━━━━━━━━━━━━━┛

┏━✧「 👑 𝐀𝐝𝐦𝐢𝐧𝐬 」✧━┓
⪼ .autoadmin   » Admin at
⪼ .kill          » Kick random
⪼ .reclut      » Reclutamiento
⪼ .npt          » Eliminar citado
⪼ .n               » @ Texto
⪼ .add [n°]   » Agregar usuario
⪼ .eliminar   » Borrar mensaje
⪼ .admin @     » Dar admin
⪼ .unadmin @  » Quitar admin
⪼ .cerrar      » Cerrar grupo
⪼ .abrir        » Abrir grupo
⪼ .kick @      » Expulsar
⪼ .welcome on/off » Bienvenida
⪼ .modoadmin   » Solo admins
┗━━━━━━━━━━━━━━━━━━┛

┏━✦「 📜 𝐄𝐱𝐭𝐫𝐚𝐬 」✦━┓
⪼ .reglascmp   » Reglas
⪼ .addmenu     » Agregar al menú
┗━━━━━━━━━━━━━━━━━━━━━┛

🌸 _By 𝐅𝐞𝐥𝐢𝐩𝐞 𝐆𝐚𝐫𝐜𝐢𝐚 夜_ 🌸
`

    await sock.sendMessage(from, {
      image: img,
      caption: texto
    }, { quoted: msg })

  }
}