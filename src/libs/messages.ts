import { T_BOT_TOKEN, T_CHAT_TOKEN } from "./config.js";

const token = T_BOT_TOKEN;
const chatIds = T_CHAT_TOKEN?.split(",") || [];

export async function SendTelegramMessage(text: string) {
  if (!token || chatIds.length === 0) return;

  try {
    for (const chatId of chatIds) {
      await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId.trim(),
          text,
          parse_mode: "HTML",
        }),
      });
    }
  } catch (err) {
    console.log(err);
  }
}

export async function SendTelegramImage(buffer: Buffer, caption: string) {
  if (!token || chatIds.length === 0) return;

  try {
    for (const chatId of chatIds) {
      const formData = new FormData();

      formData.append("chat_id", chatId.trim());
      formData.append("caption", caption);
      formData.append("parse_mode", "HTML");

      const arrayBuffer = buffer.buffer.slice(
        buffer.byteOffset,
        buffer.byteOffset + buffer.byteLength,
      ) as ArrayBuffer;

      formData.append(
        "photo",
        new Blob([arrayBuffer], { type: "image/png" }),
        "chart.png",
      );

      await fetch(`https://api.telegram.org/bot${token}/sendPhoto`, {
        method: "POST",
        body: formData,
      });
    }
  } catch (err) {
    console.log(err);
  }
}
