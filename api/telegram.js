import fetch from "node-fetch";

export default async function handler(req, res) {
  // ===== CORS НАСТРОЙКА =====
  const allowedOrigins = [
    "https://lucas555-ops.github.io",
    "https://reforkcapital.online",
    "https://www.reforkcapital.online",
    "http://localhost:3000",
    "https://re-fork-capital.vercel.app"    
  ];

  const origin = req.headers.origin || req.headers.referer;

  // Устанавливаем CORS заголовки ДО логики
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Accept");
  res.setHeader("Access-Control-Max-Age", "86400");

  if (origin && allowedOrigins.some((allowed) => origin.includes(allowed.replace("www.", "")))) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  } else {
    res.setHeader("Access-Control-Allow-Origin", "*"); // на время отладки
  }

  // Обработка preflight-запроса
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // Разрешаем только POST
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      error: "Method not allowed",
    });
  }

  try {
    console.log("✅ API call from origin:", origin);

    // ===== УНИВЕРСАЛЬНЫЙ ПАРСИНГ ТЕЛА =====
    let body;
    try {
      if (req.body && typeof req.body === "string") {
        body = JSON.parse(req.body);
      } else if (req.body && typeof req.body === "object") {
        body = req.body;
      } else {
        const buffers = [];
        for await (const chunk of req) {
          buffers.push(chunk);
        }
        const data = Buffer.concat(buffers).toString();
        body = JSON.parse(data || "{}");
      }
    } catch (err) {
      console.error("❌ Ошибка парсинга тела запроса:", err);
      body = {};
    }

    console.log("📨 Parsed body:", body);

    const { name, telegram, package: pkg, lang = "ru", source = "ReFork Capital" } = body;

    // ===== ВАЛИДАЦИЯ ПОЛЕЙ =====
    if (!name || !telegram || !pkg) {
      return res.status(400).json({
        success: false,
        error: "Отсутствуют обязательные поля (name, telegram, package)",
      });
    }

    const telegramPattern = /^@[A-Za-z0-9_]{5,32}$/;
    if (!telegramPattern.test(telegram)) {
      return res.status(400).json({
        success: false,
        error: "Invalid Telegram format. Use @username format",
      });
    }

    // ===== СЕРВЕРНЫЕ ПЕРЕМЕННЫЕ =====
    const botToken = process.env.BOT_TOKEN;
    const chatId = process.env.CHAT_ID;

    console.log("BOT_TOKEN exists:", !!botToken);
    console.log("CHAT_ID exists:", !!chatId);

    if (!botToken || !chatId) {
      return res.status(500).json({
        success: false,
        error: "Сервер не настроен. Отсутствуют BOT_TOKEN или CHAT_ID",
      });
    }

    // ===== ФОРМИРУЕМ СООБЩЕНИЕ =====
    const message = `
🔔 <b>Новая заявка ReFork Capital</b>

👤 <b>Имя:</b> ${name}
📱 <b>Telegram:</b> ${telegram}
💰 <b>Пакет:</b> ${pkg}
🕐 <b>Время:</b> ${new Date().toLocaleString("ru-RU")}
    `.trim();

    console.log("📤 Отправляем в Telegram...");

    // ===== ОТПРАВКА В TELEGRAM =====
    const telegramResponse = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: "HTML",
      }),
    });

    const telegramData = await telegramResponse.json();
    console.log("📩 Ответ от Telegram API:", telegramData);

    if (telegramResponse.ok) {
      console.log("✅ Message sent successfully!");
      return res.status(200).json({
        success: true,
        message: "✅ Сигнал получен! Заявка принята.",
      });
    } else {
      console.error("❌ Ошибка Telegram API:", telegramData);
      return res.status(500).json({
        success: false,
        error: `Ошибка Telegram: ${telegramData.description || "Неизвестная ошибка"}`,
      });
    }
  } catch (error) {
    console.error("💥 Ошибка сервера:", error);
    return res.status(500).json({
      success: false,
      error: `Внутренняя ошибка сервера: ${error.message}`,
    });
  }
}
