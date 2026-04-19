import fs from "fs";
import ffmpeg from "fluent-ffmpeg";
import { downloadContentFromMessage } from "@whiskeysockets/baileys";

export default {
  name: "s",

  execute: async ({ sock, from, msg }) => {
    try {
      const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;

      if (!quoted) {
        return await sock.sendMessage(from, {
          text: "❌ Responde a una imagen o video con *.s*"
        }, { quoted: msg });
      }

      const type = Object.keys(quoted)[0];

      if (!["imageMessage", "videoMessage"].includes(type)) {
        return await sock.sendMessage(from, {
          text: "❌ Solo imágenes o videos."
        }, { quoted: msg });
      }

      // 📥 Descargar media
      const stream = await downloadContentFromMessage(
        quoted[type],
        type === "imageMessage" ? "image" : "video"
      );

      let buffer = Buffer.from([]);
      for await (const chunk of stream) {
        buffer = Buffer.concat([buffer, chunk]);
      }

      const tmp = `./tmp_${Date.now()}`;
      const webp = `${tmp}.webp`;

      fs.writeFileSync(tmp, buffer);

      // 🎞️ Convertir a sticker
      await new Promise((resolve, reject) => {
        ffmpeg(tmp)
          .outputOptions([
            "-vcodec libwebp",
            "-vf scale=512:512:force_original_aspect_ratio=decrease,fps=15",
            "-loop 0",
            "-preset default",
            "-an",
            "-vsync 0"
          ])
          .save(webp)
          .on("end", resolve)
          .on("error", reject);
      });

      const stickerBuffer = fs.readFileSync(webp);

      // 🖼️ Sticker con preview tipo tarjeta
      await sock.sendMessage(from, {
        sticker: stickerBuffer,
        contextInfo: {
          externalAdReply: {
            title: "𝕱𝖊𝖑𝖇𝖔𝖙",
            body: "Desarrollado por Felipe 夜",
            thumbnailUrl: "https://i.pinimg.com/736x/4a/d2/63/4ad26326d288b5c78782a11ecb716a5a.jpg",
            mediaType: 1,
            renderLargerThumbnail: true
          }
        }
      }, { quoted: msg });

      fs.unlinkSync(tmp);
      fs.unlinkSync(webp);

    } catch (e) {
      console.error(e);

      await sock.sendMessage(from, {
        text: "❌ Error creando el sticker"
      }, { quoted: msg });
    }
  }
};