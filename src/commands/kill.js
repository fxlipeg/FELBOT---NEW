export default {
  name: 'kill',

  async execute({ sock, from, msg, participants, isAdmin }) {
    try {
      if (!from.endsWith('@g.us')) return

      const reply = (txt, mentions = []) =>
        sock.sendMessage(from, {
          text: txt,
          mentions
        }, { quoted: msg })

      const react = (emoji) =>
        sock.sendMessage(from, {
          react: { text: emoji, key: msg.key }
        })

      if (!isAdmin) {
        return reply('🔒 *Solo admins pueden usar este comando*')
      }

      const botId = sock.user.id.split('@')[0]

      // 🎯 Elegibles
      const eligible = participants.filter(p => {
        const id = p.id.split('@')[0]
        return !p.admin && id !== botId
      })

      if (!eligible.length) {
        return reply('⚠️ *No hay usuarios eliminables*')
      }

      const random = eligible[Math.floor(Math.random() * eligible.length)]

      // 💀 Eliminar
      await sock.groupParticipantsUpdate(from, [random.id], 'remove')

      const executor = msg.key.participant || msg.key.remoteJid

      // 🎭 Mensaje
      await reply(
        `☠️ *EJECUCIÓN REALIZADA*\n\n` +
        `🎯 Víctima: @${random.id.split('@')[0]}\n` +
        `👤 Ejecutado por: @${executor.split('@')[0]}\n\n` +
        `💀 *Ha sido eliminado del grupo*`,
        [random.id, executor]
      )

      await react('☠️')

    } catch (error) {
      console.error('Error en kill:', error)

      await sock.sendMessage(from, {
        text: '❌ Error al ejecutar kill.'
      }, { quoted: msg })
    }
  }
}