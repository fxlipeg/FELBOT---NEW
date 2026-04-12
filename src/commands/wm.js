import { downloadContentFromMessage } from "@whiskeysockets/baileys";
import { Sticker, StickerTypes } from "wa-sticker-formatter";

export default {
  name: "wm",

  execute: async ({ sock, from, msg, args }) => {
    try {
      const packName = args.join(" ");

      if (!packName) {
        return await sock.sendMessage(from, {
          text: "╭━━━〔 ⚠️ 𝖂𝖆𝖙𝖊𝖗𝖒𝖆𝖗𝖐 〕━━━╮\n┃ Usa: *.wm nombre*\n╰━━━━━━━━━━━━━━━╯"
        }, { quoted: msg });
      }

      const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;

      if (!quoted) {
        return await sock.sendMessage(from, {
          text: "❌ Responde a un sticker"
        }, { quoted: msg });
      }

      if (!quoted.stickerMessage) {
        return await sock.sendMessage(from, {
          text: "❌ Solo funciona con stickers"
        }, { quoted: msg });
      }

      // 🔥 reaccion
      await sock.sendMessage(from, {
        react: {
          text: "✏️",
          key: msg.key
        }
      });

      // 📥 descargar sticker
      const stream = await downloadContentFromMessage(
        quoted.stickerMessage,
        "sticker"
      );

      let buffer = Buffer.from([]);
      for await (const chunk of stream) {
        buffer = Buffer.concat([buffer, chunk]);
      }

      // 🧾 crear sticker con nuevo pack
      const sticker = new Sticker(buffer, {
        pack: packName,
        author: "", // 👈 puedes dejarlo vacío si quieres
        type: StickerTypes.FULL,
        quality: 100
      });

      const stickerBuffer = await sticker.toBuffer();

      // 🖼️ enviar con tarjeta
      await sock.sendMessage(from, {
        sticker: stickerBuffer,
        contextInfo: {
          externalAdReply: {
            title: "𝕱𝖊𝖑𝖇𝖔𝖙",
            body: `Desarrollado por Felipe 夜 `,
            thumbnailUrl: "https://i.pinimg.com/736x/4a/d2/63/4ad26326d288b5c78782a11ecb716a5a.jpg",
            mediaType: 1,
            renderLargerThumbnail: true
          }
        }
      }, { quoted: msg });

    } catch (e) {
      console.error(e);

      await sock.sendMessage(from, {
        text: "❌ Error al cambiar watermark"
      }, { quoted: msg });
    }
  }
};