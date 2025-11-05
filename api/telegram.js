import fetch from "node-fetch";

/**
 * Vercel Serverless Function для приема заявок и отправки их в Telegram.
 * В этот код добавлены агрессивные логи для диагностики ошибки 400.
 * После деплоя посмотрите логи Vercel, чтобы увидеть, что приходит в req.body.
 */
export default async function handler(req, res) {
  
  // 1. КОНФИГУРАЦИЯ CORS
  const allowedOrigins = [
    "https://lucas555-ops.github.io",
    "https://reforkcapital.online",
    "https://www.reforkcapital.online", 
    "http://localhost:3000",
    "https://re-fork-capital.vercel.app",
    "null" 
  ];

  const origin = req.headers.origin || req.headers.referer || '';

  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Accept");
  res.setHeader("Access-Control-Max-Age", "86400");

  let isAllowedOrigin = false;
  if (origin) {
    try {
      const url = new URL(origin);
      const originHost = url.hostname;
      
      isAllowedOrigin = allowedOrigins.some(allowed => {
        try {
            const allowedUrl = new URL(allowed);
            const cleanedOrigin = originHost.startsWith('www.') ? originHost.substring(4) : originHost;
            const cleanedAllowed = allowedUrl.hostname.startsWith('www.') ? allowedUrl.hostname.substring(4) : allowedUrl.hostname;
            return cleanedAllowed === cleanedOrigin;
        } catch (e) {
            return false;
        }
      });
    } catch (e) {
      isAllowedOrigin = false;
    }
  }

  if (isAllowedOrigin && origin) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  } else {
    res.setHeader("Access-Control-Allow-Origin", "*"); 
  }
  
  // 2. ОБРАБОТКА МЕТОДОВ
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      error: "Method not allowed",
    });
  }

  try {
    console.log("LOG: Запрос получен. Origin:", origin);
    console.log("LOG: Content-Type заголовки:", req.headers['content-type']); // ВАЖНО: Проверить этот заголовок!

    // ===== 3. САМЫЙ НАДЕЖНЫЙ ПАРСИНГ ТЕЛА (с диагностическими логами) =====
    let body = req.body;
    
    console.log("LOG: 3.1. Исходный req.body (тип):", typeof body);
    console.log("LOG: 3.2. Исходный req.body (значение):", body);

    // Если Vercel не распарсил тело и передал его как строку (JSON)
    if (typeof body === 'string' && body.length > 0) {
        try {
            body = JSON.parse(body);
            console.log("LOG: 3.3. Успешно распарсено из строки.");
        } catch (e) {
            console.error("⚠️ LOG: Ошибка парсинга JSON-строки:", e.message);
            body = {}; 
        }
    } else if (typeof body !== 'object' || body === null) {
        // Если тело undefined, null или что-то неожиданное
        body = {}; 
        console.log("LOG: 3.4. req.body был undefined/null, установлен пустой объект.");
    }

    console.log("LOG: 3.5. Финальный объект 'body':", body);

    // 4. ДЕСТРУКТУРИЗАЦИЯ И ВАЛИДАЦИЯ
    const { 
        name, 
        telegram, 
        package: pkg, 
        lang = "ru", 
        source = "ReFork Capital" 
    } = body;
    
    console.log(`LOG: 4.1. Деструктурированные значения: Name: ${name}, Telegram: ${telegram}, Package: ${pkg}`);


    if (!name || !telegram || !pkg) {
      console.error("❌ LOG: Ошибка 400. Одно или несколько обязательных полей отсутствуют/являются falsy.");
      return res.status(400).json({
        success: false,
        error: "Отсутствуют обязательные поля (name, telegram, package)",
      });
    }

    // 5. СЕРВЕРНЫЕ ПЕРЕМЕННЫЕ
    const botToken = process.env.BOT_TOKEN;
    const chatId = process.env.CHAT_ID;

    if (!botToken || !chatId) {
      console.error("❌ LOG: ОШИБКА 500. Отсутствуют BOT_TOKEN или CHAT_ID");
      return res.status(500).json({
        success: false,
        error: "Сервер не настроен. Отсутствуют BOT_TOKEN или CHAT_ID",
      });
    }

    // 6. ОТПРАВКА В TELEGRAM
    const message = `🎯 <b>Новая заявка ReFork Capital</b>\n\n` +
                   `👤 <b>Имя:</b> ${name}\n` +
                   `📱 <b>Telegram:</b> ${telegram}\n` +
                   `💰 <b>Пакет:</b> ${pkg}\n` + 
                   `🌐 <b>Язык:</b> ${lang}\n` +
                   `📍 <b>Источник:</b> ${source}\n` +
                   `⏰ <b>Время:</b> ${new Date().toLocaleString('ru-RU')}`;

    console.log("LOG: 6.1. Отправляем в Telegram...");

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

    if (telegramResponse.ok) {
      console.log("LOG: 6.2. Успех Telegram API.");
      return res.status(200).json({
        success: true,
        message: "✅ Сигнал получен! Заявка принята.",
      });
    } else {
      console.error("❌ LOG: Ошибка Telegram API:", telegramData);
      return res.status(500).json({
        success: false,
        error: `Ошибка Telegram: ${telegramData.description || "Неизвестная ошибка"}`,
      });
    }
  } catch (error) {
    console.error("💥 LOG: Критическая ошибка сервера:", error);
    return res.status(500).json({
      success: false,
      error: `Внутренняя ошибка сервера: ${error.message}`,
    });
  }
}
