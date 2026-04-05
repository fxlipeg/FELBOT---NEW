import { partidas } from '../commands/2vs2.js'

export async function handleReacciones(sock, msg, from) {
  try {

    const reaction = msg.message?.reactionMessage
    if (!reaction) return

    const emoji = reaction.text

    // 🚫 solo emojis válidos
    if (!["❤️", "👍", "💔"].includes(emoji)) return

    const data = partidas[from]
    if (!data) return

    // 🔒 solo reaccionar al mensaje actual
    if (reaction.key.id !== data.listaKey.id) return

    // 🔥 FIX REAL DEL USUARIO (ESTE ES EL IMPORTANTE)
    const user = msg.key.participant

    if (!user) return

    // 🚫 evitar bot
    const botNumber = sock.user.id.split(':')[0]
    if (user.includes(botNumber)) return

    const lleno = data.escuadra.length === 2 && data.suplentes.length === 2

    // 🔒 si lleno → solo salir
    if (lleno && emoji !== "💔") return

    // 💔 SALIR
    if (emoji === "💔") {
      const estabaLleno = lleno

      data.escuadra = data.escuadra.filter(u => u !== user)
      data.suplentes = data.suplentes.filter(u => u !== user)

      data.activo = true

      await actualizar(sock, from, data)

      if (estabaLleno) {
        await sock.sendMessage(from, {
          text: "🔓 Se liberó un cupo"
        })
      }

      return
    }

    // ❤️ ESCUADRA
    if (emoji === "❤️") {

      if (data.escuadra.length >= 2) return

      data.suplentes = data.suplentes.filter(u => u !== user)

      if (!data.escuadra.includes(user)) {
        data.escuadra.push(user)
      }
    }

    // 👍 SUPLENTE
    if (emoji === "👍") {

      if (data.suplentes.length >= 2) return

      data.escuadra = data.escuadra.filter(u => u !== user)

      if (!data.suplentes.includes(user)) {
        data.suplentes.push(user)
      }
    }

    await actualizar(sock, from, data)

  } catch (e) {
    console.log("ERROR REACCIONES:", e)
  }
}

// 🔄 ACTUALIZAR (modo limpio)
async function actualizar(sock, from, data) {

  const format = (arr, max, emoji) => {
    const filled = arr.map(u => `@${u.split("@")[0]}`)
    while (filled.length < max) filled.push(emoji)
    return filled.join("\n")
  }

  const texto = `
╭━━━〔 𝟐 𝖁𝖘 𝟐 • 𝕮𝖔𝖒𝖕𝖊 〕━━━╮

🛡️ Escuadra
${format(data.escuadra, 2, "✅")}

🧤 Suplentes
${format(data.suplentes, 2, "❕")}

╰━━━━━━━━━━━━━━━━━━╯

❤️ = Escuadra
👍 = Suplente
💔 = Salir
`

  try {
    if (data.listaKey) {
      await sock.sendMessage(from, {
        delete: data.listaKey
      })
    }
  } catch {}

  const newMsg = await sock.sendMessage(from, {
    text: texto,
    mentions: [...data.escuadra, ...data.suplentes]
  })

  data.listaKey = newMsg.key

  // 🔒 cerrar
  if (data.escuadra.length === 2 && data.suplentes.length === 2) {
    data.activo = false

    await sock.sendMessage(from, {
      text: `╭━━━〔 🔒 𝕮𝖔𝖒𝖕𝖊 𝕷𝖑𝖊𝖓𝖆 〕━━━╮
┃ Escuadra y suplentes completos
┃ Solo pueden salir (💔)
╰━━━━━━━━━━━━━━━╯`
    })
  }
}