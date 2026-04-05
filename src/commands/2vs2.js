let partidas = {}

export default {
  name: "2vs2",

  async execute({ sock, from }) {

    partidas[from] = {
      escuadra: [],
      suplentes: [],
      activo: true,
      listaKey: null
    }

    const msg = await sock.sendMessage(from, {
      text: `
╭━━━〔 𝟐 𝖁𝖘 𝟐 • 𝕮𝖔𝖒𝖕𝖊 〕━━━╮

🛡️ Escuadra
✅
✅

🧤 Suplentes
❕
❕

╰━━━━━━━━━━━━━━━━━━╯

❤️ = Escuadra
👍 = Suplente
💔 = Salir

(Reacciona a ESTE mensaje)
`
    })

    partidas[from].listaKey = msg.key
  }
}

export { partidas }