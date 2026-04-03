const idiomas = {
  es: 'español',
  en: 'ingles',
  fr: 'frances',
  pt: 'portugues',
  it: 'italiano',
  de: 'aleman',
  ja: 'japones',
  ko: 'coreano',
  zh: 'chino',
  ru: 'ruso'
}

// 🔄 nombre → código
const idiomasReverse = Object.fromEntries(
  Object.entries(idiomas).map(([k, v]) => [v, k])
)

export default {
  name: 'traductor',

  execute: async ({ sock, from, msg, args }) => {

    // 🧠 función para sacar texto (igual que tu handler)
    const getText = (msg) => {
      const m = msg.message
      return (
        m?.conversation ||
        m?.extendedTextMessage?.text ||
        m?.imageMessage?.caption ||
        m?.videoMessage?.caption ||
        m?.ephemeralMessage?.message?.conversation ||
        m?.ephemeralMessage?.message?.extendedTextMessage?.text ||
        ''
      )
    }

    const fullText = getText(msg)

    let inputText = ''
    let targetLang = 'es' // 🔥 siempre español por defecto

    // 🟡 .traductor= texto
    if (fullText.includes('=')) {
      inputText = fullText.split('=').slice(1).join('=').trim()
    }

    // 🟡 .traductor hola aleman
    else if (args.length > 0) {
      const lastWord = args[args.length - 1].toLowerCase()

      if (idiomasReverse[lastWord]) {
        targetLang = idiomasReverse[lastWord]
        inputText = args.slice(0, -1).join(' ')
      } else {
        inputText = args.join(' ')
      }
    }

    // 🟡 responder mensaje
    if (!inputText) {
      const quotedMsg = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage

      if (quotedMsg) {
        inputText =
          quotedMsg.conversation ||
          quotedMsg.extendedTextMessage?.text ||
          quotedMsg.imageMessage?.caption ||
          quotedMsg.videoMessage?.caption ||
          ''
      }
    }

    // ❌ sin texto
    if (!inputText.trim()) {
      return sock.sendMessage(from, {
        text: `
❌ Uso incorrecto

📌 Ejemplos:

• .traductor hello
• .traductor hola ingles
• .traductor bonjour español
• .traductor= i love you
• (responde a un mensaje) .traductor

🌍 Idiomas disponibles:
${Object.values(idiomas).map(i => '• ' + i).join('\n')}
        `.trim()
      }, { quoted: msg })
    }

    try {
      const res = await fetch(
        `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(inputText)}`
      )

      const data = await res.json()
      const traduccion = data?.[0]?.map(t => t[0]).join('') || '❌ Error'

      // 💬 estilo pro (el que tú quieres)
      const texto = `
╭━〔 🌍 TRADUCTOR 〕━⬣

📥 *Original:*
${inputText}

📤 *Traducción:*
${traduccion}

╰━━━━━━━━━━━━━━━━━━⬣
`.trim()

      await sock.sendMessage(from, {
        text: texto
      }, { quoted: msg })

      // ⚡ reacción
      await sock.sendMessage(from, {
        react: { text: '🌍', key: msg.key }
      })

    } catch (err) {
      console.error(err)

      await sock.sendMessage(from, {
        text: '❌ Error al traducir.'
      }, { quoted: msg })
    }
  }
}