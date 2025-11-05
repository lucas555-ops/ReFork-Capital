// api/telegram.js - УПРОЩЕННАЯ И РАБОЧАЯ ВЕРСИЯ
import fetch from "node-fetch";

export default async function handler(req, res) {
  // 1. CORS - РАЗРЕШАЕМ ВСЕ ДЛЯ ТЕСТИРОВАНИЯ
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS, GET");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  
  // 2. Preflight запрос
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }
  
  // 3. Для тестирования - GET запрос
  if (req.method === "GET") {
    return res.status(200).json({ 
      status: "API работает!",
      timestamp: new Date().toISOString(),
      environment: "Production"
    });
  }
  
  // 4. Обработка POST запроса
  if (req.method === "POST") {
    try {
      console.log("📨 POST запрос получен");
      
      // Простой парсинг тела
      let body = req.body;
      if (typeof body === "string") {
        body = JSON.parse(body);
      }
      
      console.log("Данные формы:", body);

      const { name, telegram, package: pkg } = body;

      // Валидация
      if (!name || !telegram || !pkg) {
        return res.status(400).json({
          success: false,
          error: "Не хватает обязательных полей"
        });
      }

      // Проверяем переменные окружения
      const botToken = process.env.BOT_TOKEN;
      const chatId = process.env.CHAT_ID;

      if (!botToken || !chatId) {
        console.error("❌ Отсутствуют переменные окружения");
        return res.status(500).json({
          success: false,
          error: "Сервер не настроен"
        });
      }

      // Отправляем в Telegram
      const message = `
🔔 Новая заявка ReFork Capital

👤 Имя: ${name}
📱 Telegram: ${telegram}
💰 Пакет: ${pkg}
🕐 Время: ${new Date().toLocaleString("ru-RU")}
      `.trim();

      const telegramResponse = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: "HTML"
        })
      });

      const telegramData = await telegramResponse.json();

      if (telegramResponse.ok) {
        console.log("✅ Сообщение отправлено в Telegram");
        return res.status(200).json({
          success: true,
          message: "✅ Заявка принята!"
        });
      } else {
        console.error("❌ Ошибка Telegram:", telegramData);
        return res.status(500).json({
          success: false,
          error: "Ошибка отправки в Telegram"
        });
      }

    } catch (error) {
      console.error("💥 Ошибка сервера:", error);
      return res.status(500).json({
        success: false,
        error: "Внутренняя ошибка сервера"
      });
    }
  }
  
  // 5. Другие методы не разрешены
  return res.status(405).json({ 
    success: false, 
    error: "Method not allowed" 
  });
}
