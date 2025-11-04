// /api/telegram.js
export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Accept");
  res.setHeader("Access-Control-Max-Age", "86400");

  // Preflight
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  // Безопасный парсинг JSON
  let body = req.body;
  if (typeof body === "string") {
    try {
      body = JSON.parse(body);
    } catch {
      return res.status(400).json({ success: false, error: "Invalid JSON" });
    }
  }

  const { name, telegram, package: pkg, lang = "ru", source = "ReFork Capital" } = body || {};
  if (!name || !telegram || !pkg) {
    return res.status(400).json({ success: false, error: "Missing required fields" });
  }

  const botToken = process.env.BOT_TOKEN;
  const chatId = process.env.CHAT_ID;

  if (!botToken || !chatId) {
    console.error("❌ Missing BOT_TOKEN or CHAT_ID in environment!");
    return res.status(500).json({ success: false, error: "Server misconfigured" });
  }

  const message = `
🔔 <b>Новая заявка ReFork Capital</b>

👤 <b>Имя:</b> ${name}
📱 <b>Telegram:</b> ${telegram}
💰 <b>Пакет:</b> ${pkg}
🌐 <b>Язык:</b> ${lang}
📍 <b>Источник:</b> ${source}
🕐 <b>Время:</b> ${new Date().toLocaleString("ru-RU")}
  `.trim();

  try {
    const tgResponse = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: "HTML",
      }),
    });

    const data = await tgResponse.json();
    if (!tgResponse.ok) throw new Error(data.description || "Telegram API error");

    console.log("✅ Message sent successfully:", data);
    return res.status(200).json({ success: true, message: "✅ Сигнал получен! Заявка принята." });
  } catch (err) {
    console.error("💥 Ошибка при отправке:", err);
    return res.status(500).json({ success: false, error: err.message || "Internal error" });
  }
}
