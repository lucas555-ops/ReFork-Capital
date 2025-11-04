// --- ФИНАЛЬНЫЙ СЕРВЕРНЫЙ КОД (ДЛЯ VERCEL /api/telegram.js) ---

// Эта функция должна обрабатывать req (запрос) и res (ответ)
export default async function handler(req, res) {

  // --- 1. ОБРАБОТКА CORS (Белый список) ---
  // ✅ ИСПРАВЛЕНО: Используем строгий белый список для безопасности
  const allowedOrigins = [
    'https://reforkcapital.online', // Ваш основной домен
    'https://lucas555-ops.github.io', // Ваш GitHub Pages (если нужен)
    'http://localhost:3000' // Для локальной разработки
  ];
  
  const origin = req.headers.origin;
  
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else if (origin) { 
    // Если origin есть, но его нет в списке - блокируем
    console.log('🚫 Заблокированный origin:', origin);
    return res.status(403).json({ 
      success: false, 
      error: 'Origin not allowed' 
    });
  }
  // Если origin не определен (например, запрос с того же домена), пропускаем

  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');
  res.setHeader('Access-Control-Max-Age', '86400');

  // --- 2. Обработка OPTIONS (Pre-flight) ---
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // --- 3. Обработка POST ---
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed' 
    });
  }

  try {
    // Vercel может не распарсить тело, делаем это вручную
    let body;
    try {
        body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    } catch (e) {
        body = req.body; // Оставляем как есть, если это уже объект
    }

    // --- 4. Honeypot защита ---
    if (body.website) {
      console.log('🤖 Обнаружен бот (Honeypot)');
      // Отвечаем успехом, чтобы сбить бота с толку
      return res.status(200).json({ success: true, message: '✅ Сигнал получен!' });
    }

    // --- 5. Валидация данных ---
    const { name, telegram, package: pkg, lang, source } = body;
    
    if (!name || !telegram || !pkg) {
      return res.status(400).json({ 
        success: false, 
        error: 'Отсутствуют обязательные поля (name, telegram, package)' 
      });
    }

    const telegramRegex = /^@[A-Za-z0-9_]{5,32}$/;
    if (!telegramRegex.test(telegram)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Неверный формат Telegram. Используйте @username' 
      });
    }

    // --- 6. ✅ ИСПРАВЛЕНО: Проверка ОБЕИХ версий переменных окружения ---
    const botToken = process.env.BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.CHAT_ID || process.env.TELEGRAM_CHAT_ID;

    if (!botToken || !chatId) {
      console.error('❌ ОШИБКА: Отсутствуют BOT_TOKEN или CHAT_ID в Vercel Environment Variables');
      return res.status(500).json({ 
        success: false, 
        error: 'Сервер не настроен. Свяжитесь с администратором.' 
      });
    }

    // --- 7. Формирование сообщения ---
    const message = `
🔔 <b>Новая заявка ReFork Capital</b>

👤 <b>Имя:</b> ${name}
📱 <b>Telegram:</b> ${telegram}
💰 <b>Пакет:</b> ${pkg}
🌐 <b>Язык:</b> ${lang || 'Не указан'}
📍 <b>Источник:</b> ${source || 'Не указан'}
🕐 <b>Время:</b> ${new Date().toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' })}
    `.trim();

    // --- 8. Отправка в Telegram ---
    const tgRes = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: message, parse_mode: 'HTML' }),
    });

    const tgData = await tgRes.json();
    
    if (!tgRes.ok) {
      console.error('❌ Ошибка Telegram API:', tgData);
      return res.status(500).json({ success: false, error: tgData.description || 'Ошибка Telegram' });
    }

    // --- 9. Успешный ответ ---
    return res.status(200).json({ 
      success: true, 
      message: '✅ Сигнал получен! Мы свяжемся с вами.' 
    });

  } catch (error) {
    console.error('💥 Внутренняя ошибка сервера:', error);
    return res.status(500).json({ 
      success: false, 
      error: `Внутренняя ошибка сервера: ${error.message}` 
    });
  }
}
