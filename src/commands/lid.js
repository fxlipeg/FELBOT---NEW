export default {
  name: 'lid',
  description: 'Muestra tu LID',

  async execute({ sock, from, msg }) {

    const sender = msg.key.participant || msg.key.remoteJid
    const number = sender.split('@')[0]

    await sock.sendMessage(from, {
      text: `🆔 Tu LID es:\n📱 ${number}`
    }, { quoted: msg })
  }
}