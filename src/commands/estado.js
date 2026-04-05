import Group from '../models/Group.js'

export default {
  name: 'estado',
  aliases: ['config', 'settings'],
  category: 'grupo',
  groupOnly: true,
  adminOnly: true, // 🔥 AQUÍ
  cooldown: 5,

  async execute({ sock, from, msg }) {

    const reply = (text) =>
      sock.sendMessage(from, { text }, { quoted: msg })

    let group = await Group.findOne({ groupId: from })

    if (!group) {
      group = await new Group({
        groupId: from,
        welcome: false,
        antilink: false,
        modoadmin: false
      }).save()
    }

    const data = {
      welcome: group.welcome ?? false,
      antilink: group.antilink ?? false,
      modoadmin: group.modoadmin ?? false
    }

    const nombres = {
      welcome: "👋 Bienvenida",
      antilink: "🔗 Anti-links",
      modoadmin: "🔒 Modo Admin"
    }

    let activos = 0
    let total = 0
    let lista = ''

    const orden = ['welcome', 'antilink', 'modoadmin']

    for (let key of orden) {

      total++

      const valor = data[key]
      if (valor) activos++

      const estado = valor ? "✅" : "❌"
      const estadoTxt = valor ? "ON" : "OFF"

      const nombre = nombres[key] || key

      lista += `┃ ${estado} ${nombre}\n`
      lista += `┃    ↳ ${estadoTxt}\n`
    }

    const porcentaje = Math.floor((activos / total) * 100)

    const llenos = Math.floor(porcentaje / 10)
    const barra = '▰'.repeat(llenos) + '▱'.repeat(10 - llenos)

    const nivel =
      porcentaje === 100 ? "🚀 COMPLETO" :
      porcentaje >= 50 ? "⚡ ESTABLE" :
      "🐢 BÁSICO"

    const texto = `
━━〔 ⚙️ ESTADO - GRUPO 〕━━┫
┃
┃ 📋 COMANDOS ACTIVADOS
┃
${lista}┃
┃
┣━━━━━━━━━━━━━━━━━━━━━━━┫
┃ 📊 Progreso: ${porcentaje}%
┃ ${barra}
┃ 🧠 Estado: ${nivel}
┃ 🔥 Activos: ${activos}/${total}
┃
╰━━━━━━━━━━━━━━━━━━━━━━━╯
`

    await reply(texto.trim())
  }
}