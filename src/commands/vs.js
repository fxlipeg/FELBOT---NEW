let partidas = {}

const configs = {
  "2vs2": { escuadra: 2, suplentes: 2, titulo: "𝟐 𝖁𝖘 𝟐 • 𝕮𝖔𝖒𝖕𝖊", tipo: "normal" },
  "4vs4": { escuadra: 4, suplentes: 2, titulo: "𝟒 𝖁𝖘 𝟒 • 𝕮𝖔𝖒𝖕𝖊", tipo: "normal" },
  "6vs6": { escuadra: 6, suplentes: 3, titulo: "𝟔 𝖁𝖘 𝟔 • 𝕮𝖔𝖒𝖕𝖊", tipo: "normal" },

  "int2": { escuadra: 2, titulo: "𝟐 𝖁𝖘 𝟐 • *ℑ𝔫𝔱𝔢𝔯𝔫𝔞*", tipo: "interna" },
  "int4": { escuadra: 4, titulo: "𝟒 𝖁𝖘 𝟒 • *ℑ𝔫𝔱𝔢𝔯𝔫𝔞*", tipo: "interna" },
  "int6": { escuadra: 6, titulo: "𝟔 𝖁𝖘 𝟔 • *ℑ𝔫𝔱𝔢𝔯𝔫𝔞*", tipo: "interna" }
}

export default {
  name: ["2vs2", "4vs4", "6vs6", "int2", "int4", "int6"],

  async execute({ sock, from, command, args, msg }) {

    const config = configs[command]
    if (!config) return

    const horaTexto = parseHora(args.join(" "))

    partidas[from] = {
      escuadra: [],
      suplentes: [],
      equipo1: [],
      equipo2: [],
      listaKey: null,
      config,
      hora: horaTexto
    }

    const sentMsg = await sock.sendMessage(from, {
      text: generarTexto(partidas[from])
    }, { quoted: msg })

    // 🔥 CLAVE CORRECTA
    partidas[from].listaKey = sentMsg.key
  }
}

// 🔥 REACCIONES
export async function handleReaccion(sock, msg, from) {

  const reaction = msg.message?.reactionMessage
  if (!reaction) return

  const emoji = reaction.text
  if (!["❤️", "👍", "💔"].includes(emoji)) return

  const data = partidas[from]
  if (!data || !data.listaKey) return

  // 🔥 VALIDACIÓN CORRECTA
  if (
    reaction.key.id !== data.listaKey.id ||
    reaction.key.remoteJid !== from
  ) return

  const user = msg.key.participant || msg.participant
  if (!user) return

  const botNumber = sock.user.id.split(':')[0]
  if (user.includes(botNumber)) return

  const { escuadra: maxE, suplentes: maxS, tipo } = data.config

  const estabaEscuadraLlena = data.escuadra.length === maxE
  const estabaSuplentesLlena = data.suplentes.length === maxS
  const estabaEquipo1Lleno = data.equipo1.length === maxE
  const estabaEquipo2Lleno = data.equipo2.length === maxE

  // 💔 SALIR
  if (emoji === "💔") {
    data.escuadra = data.escuadra.filter(u => u !== user)
    data.suplentes = data.suplentes.filter(u => u !== user)
    data.equipo1 = data.equipo1.filter(u => u !== user)
    data.equipo2 = data.equipo2.filter(u => u !== user)
    return actualizar(sock, from, data)
  }

  // 🔵 NORMAL
  if (tipo === "normal") {

    if (emoji === "❤️") {
      if (data.escuadra.length >= maxE) return
      data.suplentes = data.suplentes.filter(u => u !== user)
      if (!data.escuadra.includes(user)) data.escuadra.push(user)
    }

    if (emoji === "👍") {
      if (data.suplentes.length >= maxS) return
      data.escuadra = data.escuadra.filter(u => u !== user)
      if (!data.suplentes.includes(user)) data.suplentes.push(user)
    }
  }

  // 🔴 INTERNA
  if (tipo === "interna") {

    if (emoji === "❤️") {
      if (data.equipo1.length >= maxE) return
      data.equipo2 = data.equipo2.filter(u => u !== user)
      if (!data.equipo1.includes(user)) data.equipo1.push(user)
    }

    if (emoji === "👍") {
      if (data.equipo2.length >= maxE) return
      data.equipo1 = data.equipo1.filter(u => u !== user)
      if (!data.equipo2.includes(user)) data.equipo2.push(user)
    }
  }

  await actualizar(sock, from, data)

  // 🚨 ALERTAS PRO
  if (tipo === "normal") {

    if (!estabaEscuadraLlena && data.escuadra.length === maxE) {
      await sock.sendMessage(from, {
        text: `*🚫 ESCUADRA LLENA*\nYa no hay espacios disponibles.`
      })
    }

    if (!estabaSuplentesLlena && data.suplentes.length === maxS) {
      await sock.sendMessage(from, {
        text: `*🚫 SUPLENTES LLENOS*\nYa no hay espacios disponibles.`
      })
    }
  }

  if (tipo === "interna") {

    if (!estabaEquipo1Lleno && data.equipo1.length === maxE) {
      await sock.sendMessage(from, {
        text: `*🚫 EQUIPO 1 LLENO*\nYa no hay espacios disponibles.`
      })
    }

    if (!estabaEquipo2Lleno && data.equipo2.length === maxE) {
      await sock.sendMessage(from, {
        text: `*🚫 EQUIPO 2 LLENO*\nYa no hay espacios disponibles.`
      })
    }
  }
}

// 🧠 TEXTO PRO
function generarTexto(data) {

  const { escuadra: maxE, suplentes: maxS, titulo, tipo } = data.config

  const format = (arr, max, emoji) => {
    const filled = arr.map(u => `${emoji} │ @${u.split("@")[0]}`)
    while (filled.length < max) filled.push(`${emoji} │ vacío`)
    return filled.join("\n")
  }

  // 🔴 INTERNA
  if (tipo === "interna") {
    return `
╭━━━〔 ${titulo} 〕━━━╮
${data.hora ? `⏰ ${data.hora}\n` : ""}

🛡️ Escuadra 1 (${maxE - data.equipo1.length})
${format(data.equipo1, maxE, "🥷")}

🛡️ Escuadra 2 (${maxE - data.equipo2.length})
${format(data.equipo2, maxE, "🥷")}

╰━━━━━━━━━━━━━━━╯

❤️ = Equipo 1
👍 = Equipo 2
💔 = Salir
`
  }

  // 🔵 NORMAL
  return `
╭━━━〔 ${titulo} 〕━━━╮
${data.hora ? `⏰ ${data.hora}\n` : ""}

🛡️ Escuadra (${maxE - data.escuadra.length})
${format(data.escuadra, maxE, "🥷")}

🧤 Suplentes (${maxS - data.suplentes.length})
${format(data.suplentes, maxS, "❕")}

╰━━━━━━━━━━━━━━━╯

❤️ = Escuadra
👍 = Suplente
💔 = Salir
`
}

// 🔄 ACTUALIZAR (FIX REAL)
async function actualizar(sock, from, data) {

  const texto = generarTexto(data)

  try {
    await sock.sendMessage(from, {
      text: texto,
      edit: data.listaKey, // 🔥 FIX
      mentions: [
        ...data.escuadra,
        ...data.suplentes,
        ...data.equipo1,
        ...data.equipo2
      ]
    })
  } catch {
    const newMsg = await sock.sendMessage(from, {
      text: texto,
      mentions: [
        ...data.escuadra,
        ...data.suplentes,
        ...data.equipo1,
        ...data.equipo2
      ]
    })
    data.listaKey = newMsg.key
  }
}

// 🕒 HORA
function parseHora(texto) {
  if (!texto) return null

  const match = texto.match(/(\d{1,2})\s*(am|pm)\s*(co|mx|us)?/i)
  if (!match) return texto

  let hora = parseInt(match[1])
  const periodo = match[2].toLowerCase()
  const base = (match[3] || "co").toLowerCase()

  if (periodo === "pm" && hora !== 12) hora += 12
  if (periodo === "am" && hora === 12) hora = 0

  let col, mx, us

  if (base === "co") {
    col = hora
    mx = (hora - 1 + 24) % 24
    us = (hora - 1 + 24) % 24
  } else if (base === "mx") {
    mx = hora
    col = (hora + 1) % 24
    us = hora
  } else {
    us = hora
    col = (hora + 1) % 24
    mx = hora
  }

  const format = h => {
    const p = h >= 12 ? "pm" : "am"
    const hr = h % 12 === 0 ? 12 : h % 12
    return `${hr} ${p}`
  }

  return `🇨🇴 ${format(col)} | 🇲🇽 ${format(mx)} | 🇺🇸 ${format(us)}`
}

export { partidas }