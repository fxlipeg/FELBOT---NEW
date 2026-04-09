import fs from 'fs'
import path from 'path'

export default {
  name: 'owner',
  aliases: ['onwer', 'creador', 'dev'],
  category: 'info',

  execute: async ({ sock, from, msg }) => {

    const fecha = new Date().toLocaleDateString('es-CO', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    })

    // 📹 VIDEO LOCAL (estable)
    const video = fs.readFileSync(
      path.resolve('src/assets/gifs/menu/menu.mp4') // puedes cambiarlo luego
    )

    const texto = `
╭ 👑 𝐎𝐖𝐍𝐄𝐑 - 𝐅𝐄𝐋𝐁𝐎𝐓 夜 ╮
┃ 👑 Creador: Fxlipe 夜
┃ 🌸 Co-Creadora: Yamileth
┃ ⚙️ Motor: Baileys MD
┃ 📅 Fecha: ${fecha}
╰━━━━━━━━━━━━━╯

╭━〔 💎 𝐄𝐒𝐓𝐀𝐃𝐎 〕━╮
┃ ✦ Sistema activo
┃ ✦ Bot optimizado
┃ ✦ Uso profesional
╰━━━━━━━━━━━━━╯

🚀 Usa *.menu* para ver comandos

✦〔 👑 FELBOT OWNER 👑 〕✦
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