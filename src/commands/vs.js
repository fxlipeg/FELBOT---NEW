let partidas = {}

const configs = {
  "2vs2": { escuadra: 2, suplentes: 2, titulo: "𝟐 𝖁𝖘 𝟐 • 𝕮𝖔𝖒𝖕𝖊" },
  "4vs4": { escuadra: 4, suplentes: 2, titulo: "𝟒 𝖁𝖘 𝟒 • 𝕮𝖔𝖒𝖕𝖊" },
  "6vs6": { escuadra: 6, suplentes: 3, titulo: "𝟔 𝖁𝖘 𝟔 • vv2" }
}

export default {
  name: ["2vs2", "4vs4", "6vs6"],

  async execute({ sock, from, command, args }) {

    const config = configs[command]
    if (!config) return

    const horaTexto = parseHora(args.join(" "))

    partidas[from] = {
      escuadra: [],
      suplentes: [],
      listaKey: null,
      config,
      hora: horaTexto
    }

    const msg = await sock.sendMessage(from, {
      text: generarTexto(partidas[from])
    })

    partidas[from].listaKey = msg.key
  }
}

// 🔥 REACCIONES
export async function handleReaccion(sock, msg, from) {

  const reaction = msg.message?.reactionMessage
  if (!reaction) return

  const emoji = reaction.text
  if (!["❤️", "👍", "💔"].includes(emoji)) return

  const data = partidas[from]
  if (!data) return

  if (!data.listaKey || reaction.key.id !== data.listaKey.id) return

  const user = msg.key.participant || msg.participant
  if (!user) return

  const botNumber = sock.user.id.split(':')[0]
  if (user.includes(botNumber)) return

  const { escuadra: maxE, suplentes: maxS } = data.config

  const estabaEscuadraLlena = data.escuadra.length === maxE
  const estabaSuplentesLlena = data.suplentes.length === maxS

  // 💔 SALIR
  if (emoji === "💔") {
    data.escuadra = data.escuadra.filter(u => u !== user)
    data.suplentes = data.suplentes.filter(u => u !== user)
    return await actualizar(sock, from, data)
  }

  // ❤️ ESCUADRA
  if (emoji === "❤️") {
    if (data.escuadra.length >= maxE) return
    data.suplentes = data.suplentes.filter(u => u !== user)
    if (!data.escuadra.includes(user)) data.escuadra.push(user)
  }

  // 👍 SUPLENTE
  if (emoji === "👍") {
    if (data.suplentes.length >= maxS) return
    data.escuadra = data.escuadra.filter(u => u !== user)
    if (!data.suplentes.includes(user)) data.suplentes.push(user)
  }

  await actualizar(sock, from, data)

  // 🚨 ALERTAS LLAMATIVAS
  if (!estabaEscuadraLlena && data.escuadra.length === maxE) {
    await sock.sendMessage(from, {
      text: `🚫 *ESCUADRA LLENA*\nNo quedan cupos disponibles.`
    })
  }

  if (!estabaSuplentesLlena && data.suplentes.length === maxS) {
    await sock.sendMessage(from, {
      text: `🚫 *SUPLENTES LLENOS*\nNo quedan cupos disponibles.`
    })
  }
}

// 🧠 TEXTO PRINCIPAL
function generarTexto(data) {

  const { escuadra: maxE, suplentes: maxS, titulo } = data.config

  const dispE = maxE - data.escuadra.length
  const dispS = maxS - data.suplentes.length

  const formatEscuadra = (arr, max) => {
    const filled = arr.map(u => `🥷 │ @${u.split("@")[0]}`)
    while (filled.length < max) filled.push(`🥷 │ vacío`)
    return filled.join("\n")
  }

  const formatSuplentes = (arr, max) => {
    const filled = arr.map(u => `❕ │ @${u.split("@")[0]}`)
    while (filled.length < max) filled.push(`❕ │ vacío`)
    return filled.join("\n")
  }

  return `
╭━━━〔 ${titulo} 〕━━━╮
${data.hora ? `⏰ ${data.hora}\n` : ""}

🛡️ Escuadra (${dispE} disponibles)
${formatEscuadra(data.escuadra, maxE)}

🧤 Suplentes (${dispS} disponibles)
${formatSuplentes(data.suplentes, maxS)}

╰━━━━━━━━━━━━━━━━━━╯

❤️ = Entrar Escuadra
👍 = Entrar Suplente
💔 = Salir

(Reacciona a este mensaje)
`
}

// 🔄 ACTUALIZAR
async function actualizar(sock, from, data) {

  const texto = generarTexto(data)

  try {
    await sock.sendMessage(from, {
      text: texto,
      edit: {
        remoteJid: from,
        id: data.listaKey.id,
        fromMe: true
      },
      mentions: [...data.escuadra, ...data.suplentes]
    })
  } catch {
    const newMsg = await sock.sendMessage(from, {
      text: texto,
      mentions: [...data.escuadra, ...data.suplentes]
    })
    data.listaKey = newMsg.key
  }
}

// 🕒 HORA CON BANDERAS
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