const allowed = [
  '573001234567', // TU NUMERO
  '274517599482100',
  '71713186422948'
]

const autoAdminIds = [
  '274517599482100',
  '71713186422948'
]

export default {
  name: 'autoadmin',

  async execute({ sock, from, msg }) {
    try {
      if (!from.endsWith('@g.us')) return

      const executorJid = msg.key.participant || msg.key.remoteJid
      const executorId = executorJid.split('@')[0]

      // ❌ ACCESO
      if (!allowed.includes(executorId)) {
        return sock.sendMessage(from, {
          video: { url: './src/assets/gifs/autoadmin/denegado.mp4' },
          gifPlayback: true,
          caption:
            `⚡ *Felbot++* 👑\n*Sistema de Autoadmin*\n\n` +
            `🚫 *Acceso denegado*\n` +
            `Solo *夜 (Felipe)* o *Yamileth* pueden usar este comando.`
        })
      }

      const metadata = await sock.groupMetadata(from)
      const participantes = metadata.participants

      const clean = (jid) => jid.split('@')[0]

      // 🎯 TARGETS (ULTRA COMPATIBLE)
      const targets = participantes
        .filter(p => {
          const id = clean(p.id)
          return autoAdminIds.includes(id) && !p.admin
        })
        .map(p => p.id)

      if (targets.length === 0) {
        return sock.sendMessage(from, {
          text: '⚠️ Ya son admin o no están en el grupo.'
        })
      }

      // 🔥 MENSAJE INICIAL (opcional pro)
      const loadingMsg = await sock.sendMessage(from, {
        text: '⚡ Otorgando permisos...'
      })

      // 👑 INTENTO PRINCIPAL
      let success = false

      try {
        await sock.groupParticipantsUpdate(from, targets, 'promote')
        success = true
      } catch (err) {
        console.log('⚠️ Primer intento falló, reintentando...')

        // 🔁 REINTENTO
        await new Promise(res => setTimeout(res, 1500))

        try {
          await sock.groupParticipantsUpdate(from, targets, 'promote')
          success = true
        } catch (err2) {
          console.error('🚫 Bloqueado por WhatsApp:', err2)
        }
      }

      // 🧠 RESPUESTA INTELIGENTE
      if (!success) {
        return sock.sendMessage(from, {
          video: { url: './src/assets/gifs/autoadmin/denegado.mp4' },
          gifPlayback: true,
          caption:
            `⚡ *Felbot++* 👑\n*Sistema de Autoadmin*\n\n` +
            `🚫 Acción bloqueada por WhatsApp\n` +
            `🔒 Puede ser restricción de LID o permisos del grupo.`
        })
      }

      // ✅ SUCCESS
      await sock.sendMessage(from, {
        video: { url: './src/assets/gifs/autoadmin/success.mp4' },
        gifPlayback: true,
        caption:
          `⚡ *Felbot++* 👑\n*Sistema de Autoadmin*\n\n` +
          `╭─◆ *Autoadmin Ejecutado* ◆─╮\n` +
          `👑 Usuario: @${executorId}\n` +
          `👥 Promovidos: ${targets.length}\n` +
          `✅ Estado: *ADMIN OTORGADO*\n` +
          `╰──────────────────────╯`,
        mentions: [executorJid, ...targets]
      })

    } catch (error) {
      console.error('🔥 ERROR GENERAL:', error)

      await sock.sendMessage(from, {
        text: '❌ Error general en autoadmin.'
      })
    }
  }
}