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

    // 🔹 LID CLAVE (SIN @)
    const lidClave = '83073928568937'

    // 📹 VIDEO
    const video = fs.readFileSync(
      path.resolve('src/assets/gifs/menu/menu.mp4')
    )

    let coCreadoras = ''

    try {

      if (from.endsWith('@g.us')) {

        const metadata = await sock.groupMetadata(from)

        // 🔥 NORMALIZAR IDS (AQUÍ ESTÁ LA CLAVE)
        const participantes = metadata.participants.map(p => {
          let id = p.id || p.jid || ''

          // quitar todo lo raro
          id = id.split('@')[0]      // quita @s.whatsapp.net
          id = id.split(':')[0]      // quita :device
          
          return id
        })

        // 🔥 DEBUG (opcional, puedes quitar luego)
        console.log('Participantes:', participantes)

        const existe = participantes.includes(lidClave)

        if (existe) {
          // 👉 SI ESTÁ
          coCreadoras = `
┃ 🌸 Co-Creadora: Yamileth
┃ 🌸 Co-Creadora: Yza
┃ 🌸 Co-Creadora: Alee`
        } else {
          // 👉 SI NO ESTÁ
          coCreadoras = `
┃ 🌸 Co-Creadora: Yamileth`
        }

      } else {
        // 👉 PRIVADO
        coCreadoras = `
┃ 🌸 Co-Creadora: Yamileth`
      }

    } catch (e) {
      console.log('Error detectando participantes:', e)

      // fallback por si algo falla
      coCreadoras = `
┃ 🌸 Co-Creadora: Yamileth`
    }

    const texto = `
╭ 👑 𝐎𝐖𝐍𝐄𝐑 - 𝐅𝐄𝐋𝐁𝐎𝐓 夜 ╮
┃ 👑 Creador: Fxlipe 夜${coCreadoras}
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