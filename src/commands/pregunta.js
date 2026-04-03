export default {
  name: 'pregunta',

  execute: async ({ sock, from, args, msg }) => {

    const pregunta = args.join(' ')

    if (!pregunta) {
      return sock.sendMessage(from, {
        text: '❌ Escribe una pregunta\nEjemplo: .pregunta voy a ser millonario?'
      }, { quoted: msg })
    }

    // 🔮 respuestas divididas por tipo
    const respuestas = [
      'Sí 😌',
      'No 😬',
      'Tal vez 🤔',
      'Nunca 💀',
      'Claro que sí 😎',
      'Ni lo sueñes 😂',
      'ABSOLUTAMENTE 🔥',
      'No tengo dudas 😏',
      'Eso está complicado...',
      'Todo apunta a que sí 👀',
      'Mejor no te ilusiones 😭',
      'El destino dice que sí ✨',
      'El destino dice que no 🚫',
      'Pregúntalo más tarde ⏳',
      'Eso es secreto 🤫',
      'JAJA no 😹'
    ]

    const random = respuestas[Math.floor(Math.random() * respuestas.length)]

    // 💬 diseño más bonito
    const texto = `
╭━〔 🔮 ORÁCULO FELBOT 〕━⬣

❓ *Pregunta:*
_${pregunta}_

✨ *Respuesta:*
👉 ${random}

╰━━━━━━━━━━━━━━━━━━⬣
`.trim()

    await sock.sendMessage(from, {
      text: texto
    }, { quoted: msg })

    // ⚡ reacción
    await sock.sendMessage(from, {
      react: { text: '🔮', key: msg.key }
    })
  }
}