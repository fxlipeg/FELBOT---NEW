export default {
  name: 'add',
  groupOnly: true,
  adminOnly: true,

  async execute({ sock, from, args, reply }) {
    try {
      let number = args[0]?.replace(/\D/g, '')
      const PAIS_DEFECTO = '57' // 🇨🇴

      if (!number) {
        return reply('❗ *Uso:* .add 57300XXXXXXX')
      }

      // 🌎 Detectar país automáticamente
      if (!/^(1|52|54|55|56|57|58|51|53|59)/.test(number)) {
        number = PAIS_DEFECTO + number
      }

      // 🇲🇽 Fix México
      if (number.startsWith('52') && !number.startsWith('521')) {
        number = '521' + number.slice(2)
      }

      const target = `${number}@s.whatsapp.net`

      if (target === sock.user.id) {
        return reply('❌ No puedo agregarme a mí mismo.')
      }

      // 🔍 Verificar si existe en WhatsApp
      const [result] = await sock.onWhatsApp(number)

      if (!result?.exists) {
        return reply('⚠️ Ese número no está registrado en WhatsApp.')
      }

      // ⏳ Mensaje previo
      await reply(`⏳ *Agregando a @${number}...*`, [target])

      // 👑 Agregar al grupo
      await sock.groupParticipantsUpdate(from, [target], 'add')

      // ❌ NO enviamos bienvenida aquí
      // ✅ Tu sistema group-participants.update se encarga

    } catch (err) {
      console.error('❌ Error en .add:', err)

      // 🔒 PRIVACIDAD / NO ADMIN
      if (err?.message?.includes('403')) {
        return reply(
          `🚫 *No se pudo agregar*\n\n` +
          `📵 El usuario tiene privacidad activada\n` +
          `🔗 Usa link de invitación`
        )
      }

      // ⚠️ YA ESTÁ EN EL GRUPO
      if (err?.message?.includes('409')) {
        return reply('⚠️ El usuario ya está en el grupo.')
      }

      reply('❌ Error al agregar usuario.')
    }
  }
}