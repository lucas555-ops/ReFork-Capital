import fetch from "node-fetch";

/**
 * Vercel Serverless Function для приема заявок и отправки их в Telegram.
 * * Ключевые исправления:
 * 1. Улучшенный CORS (разрешает POST и OPTIONS).
 * 2. Надежный парсинг req.body для предотвращения ошибки "Cannot destructure...".
 * 3. Исправлено использование переменной 'pkg' в сообщении (ранее было 'package').
 */
export default async function handler(req, res) {
  
  // 1. КОНФИГУРАЦИЯ CORS
  const allowedOrigins = [
    "https://lucas555-ops.github.io",
    "https://reforkcapital.online",
    "https://www.reforkcapital.online", 
    "http://localhost:3000",
    "https://re-fork-capital.vercel.app",
    "null" // Для локального тестирования
  ];

  const origin = req.headers.origin || req.headers.referer || '';

  // Устанавливаем общие заголовки для CORS
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Accept");
  res.setHeader("Access-Control-Max-Age", "86400");

  let isAllowedOrigin = false;
  if (origin) {
    try {
      const url = new URL(origin);
      const originHost = url.hostname;
      
      // Проверяем, совпадает ли хост с одним из разрешенных
      isAllowedOrigin = allowedOrigins.some(allowed => {
        try {
            const allowedUrl = new URL(allowed);
            // Сравниваем хосты (исключая www. в обоих случаях для большей гибкости)
            const cleanedOrigin = originHost.startsWith('www.') ? originHost.substring(4) : originHost;
            const cleanedAllowed = allowedUrl.hostname.startsWith('www.') ? allowedUrl.hostname.substring(4) : allowedUrl.hostname;
            return cleanedAllowed === cleanedOrigin;
        } catch (e) {
            return false;
        }
      });

    } catch (e) {
      // Ошибка парсинга URL
      isAllowedOrigin = false;
    }
  }

  // Установка заголовка Access-Control-Allow-Origin
  if (isAllowedOrigin && origin) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  } else {
    // Разрешаем "*" для ReqBin и неизвестных источников. 
    // Внимание: для POST-запросов это безопасно, так как мы не используем куки или аутентификацию.
    res.setHeader("Access-Control-Allow-Origin", "*"); 
  }
  
  // 2. ОБРАБОТКА МЕТОДОВ
  if (req.method === "OPTIONS") {
    // Ответ на preflight-запрос CORS
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      error: "Method not allowed",
    });
  }

  try {
    console.log("✅ API call from origin:", origin);

    // ===== 3. САМЫЙ НАДЕЖНЫЙ ПАРСИНГ ТЕЛА =====
    let body = req.body;
    
    // Если Vercel не распарсил тело и передал его как строку (JSON)
    if (typeof body === 'string' && body.length > 0) {
        try {
            body = JSON.parse(body);
        } catch (e) {
            console.error("⚠️ Ошибка парсинга JSON-строки:", e.message);
            body = {}; 
        }
    } else if (typeof body !== 'object' || body === null) {
        // Если тело undefined, null или что-то неожиданное
        body = {}; 
    }

    console.log("📨 Parsed body:", body);

    // 4. ДЕСТРУКТУРИЗАЦИЯ И ВАЛИДАЦИЯ
    // package: pkg создает переменную 'pkg' из поля 'package'
    const { 
        name, 
        telegram, 
        package: pkg, 
        lang = "ru", 
        source = "ReFork Capital" 
    } = body;

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

    // 5. СЕРВЕРНЫЕ ПЕРЕМЕННЫЕ
    const botToken = process.env.BOT_TOKEN;
    const chatId = process.env.CHAT_ID;

    if (!botToken || !chatId) {
      console.error("❌ ОШИБКА: Отсутствуют BOT_TOKEN или CHAT_ID");
      return res.status(500).json({
        success: false,
        error: "Сервер не настроен. Отсутствуют BOT_TOKEN или CHAT_ID",
      });
    }

    // 6. ОТПРАВКА В TELEGRAM
    const message = `🎯 <b>Новая заявка ReFork Capital</b>\n\n` +
                   `👤 <b>Имя:</b> ${name}\n` +
                   `📱 <b>Telegram:</b> ${telegram}\n` +
                   `💰 <b>Пакет:</b> ${pkg}\n` + // ИСПОЛЬЗУЕМ 'pkg'
                   `🌐 <b>Язык:</b> ${lang}\n` +
                   `📍 <b>Источник:</b> ${source}\n` +
                   `⏰ <b>Время:</b> ${new Date().toLocaleString('ru-RU')}`;

    console.log("📤 Отправляем в Telegram...");

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
    console.error("💥 Критическая ошибка сервера:", error);
    return res.status(500).json({
      success: false,
      error: `Внутренняя ошибка сервера: ${error.message}`,
    });
  }
}
