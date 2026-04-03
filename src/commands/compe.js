export default {
  name: "compe",

  execute: async ({ sock, from }) => {
    try {
      const metadata = await sock.groupMetadata(from)

      const crearLista = (escuadra = [], suplentes = []) => {
        const format = (arr, max, emoji) => {
          const filled = arr.map(u => `@${u.split("@")[0]}`)
          while (filled.length < max) filled.push(emoji)
          return filled.join("\n")
        }

        return `
╭━━━〔 𝟒 𝖁𝖘 𝟒 • 𝕮𝖔𝖒𝖕𝖊 〕━━━╮

🏷️ 𝕲𝖗𝖚𝖕𝖔: ${metadata.subject}
⚔️ 𝕮𝖔𝖓𝖙𝖗𝖆: ???

🔥 Hora: 8:00 PM 🇨🇴 🔥

╰━━━━━━━━━━━━━━━━━━━━━━╯

╭──〔 🛡️ 𝕰𝖘𝖈𝖚𝖆𝖉𝖗𝖆 〕──╮
${format(escuadra, 4, "✅")}
╰────────────────╯

╭──〔 🧤 𝕾𝖚𝖕𝖑𝖊𝖓𝖙𝖊𝖘 〕──╮
${format(suplentes, 2, "❕")}
╰────────────────╯
`
      }

      // 📌 enviar lista inicial
      let msgLista = await sock.sendMessage(from, {
        text: crearLista()
      })

      const pollMsg = await sock.sendMessage(from, {
        poll: {
          name: "🗳️ Elige tu posición",
          values: ["🛡️ Escuadra", "🧤 Suplente"],
          selectableCount: 1
        }
      })

      const data = {
        listaKey: msgLista.key,
        pollId: pollMsg.key.id,
        escuadra: [],
        suplentes: [],
        votos: {},
        cerrado: false
      }

      // 🔥 función GOD (fake edit)
      const actualizarLista = async () => {
        try {
          const nuevaLista = crearLista(data.escuadra, data.suplentes)

          // 💀 borrar anterior
          await sock.sendMessage(from, {
            delete: data.listaKey
          })

          // 🚀 enviar nueva
          const newMsg = await sock.sendMessage(from, {
            text: nuevaLista,
            mentions: [...data.escuadra, ...data.suplentes]
          })

          // 🔁 actualizar referencia
          data.listaKey = newMsg.key

        } catch (e) {
          console.log("Error actualizando lista:", e)
        }
      }

      // 🔥 LISTENER
      const listener = async (updates) => {
        for (const update of updates) {

          if (!update.pollUpdates) continue
          if (update.key.id !== data.pollId) continue
          if (data.cerrado) return

          for (const vote of update.pollUpdates) {

            const user = vote.voter

            // quitar anterior
            if (data.votos[user]) {
              const prev = data.votos[user]
              data[prev] = data[prev].filter(u => u !== user)
            }

            const option = vote.selectedOptions[0]
            if (!option) continue

            let tipo = option.includes("Escuadra") ? "escuadra" : "suplentes"

            // 🚫 límite escuadra
            if (tipo === "escuadra" && data.escuadra.length >= 4) continue

            data.votos[user] = tipo
            data[tipo].push(user)

            // 🔒 cerrar
            if (data.escuadra.length === 4) {
              data.cerrado = true

              await sock.sendMessage(from, {
                text: `╭━━━〔 🔒 𝕮𝖔𝖒𝖕𝖊 𝕷𝖑𝖊𝖓𝖆 〕━━━╮
┃ Escuadra completa
┃ Ya no se aceptan jugadores
╰━━━━━━━━━━━━━━━╯`
              })

              sock.ev.off("messages.update", listener)
            }
          }

          // ⚡ actualizar lista
          await actualizarLista()
        }
      }

      sock.ev.on("messages.update", listener)

    } catch (e) {
      console.error(e)
    }
  }
}