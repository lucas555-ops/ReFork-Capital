// /api/telegram.js
module.exports = async function handler(req, res) {
  
  // ===== ✅ ИСПРАВЛЕНИЕ CORS WHITELIST (Добавлен 'www') =====
  const allowedOrigins = [
    'https://lucas555-ops.github.io',
    'https://reforkcapital.online',
    'https://www.reforkcapital.online', // ✅ ДОБАВЛЕНО
    'http://localhost:3000',
    'null' // Для локальных тестов file://
  ];
  
  const origin = req.headers.origin;
  
  // Устанавливаем заголовки
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');
  res.setHeader('Access-Control-Max-Age', '86400');
  
  // Проверяем origin и устанавливаем соответствующий заголовок
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else if (origin) { // Блокируем, только если origin ЕСТЬ, но его НЕТ в списке
    console.log('🚫 Заблокированный origin:', origin);
    return res.status(403).json({ 
      success: false, 
      error: 'Origin not allowed' 
    });
  }
  // Если origin не определен (например, запрос с того же домена), пропускаем

  // Обрабатываем OPTIONS запросы для CORS
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Разрешаем только POST
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed' 
    });
  }

  try {
    console.log('✅ API call from allowed origin:', origin);
    
    // Vercel может не распарсить тело, делаем это вручную
    let body;
    try {
        body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    } catch (e) {
        body = req.body; // Оставляем как есть, если это уже объект
    }
    
    const { name, telegram, package: pkg, lang = 'ru', source = 'ReFork Capital' } = body;

    // Проверяем обязательные поля
    if (!name || !telegram || !pkg) {
      return res.status(400).json({ 
        success: false, 
        error: 'Отсутствуют обязательные поля' 
      });
    }

    // ===== ВАЛИДАЦИЯ TELEGRAM =====
    const telegramPattern = /^@[A-Za-z0-9_]{5,32}$/;
    if (!telegramPattern.test(telegram)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid Telegram format. Use @username format' 
      });
    }

    // ✅ ИСПРАВЛЕНО: Проверяем оба варианта имен переменных
    const botToken = process.env.TELEGRAM_BOT_TOKEN || process.env.BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID || process.env.CHAT_ID;

    if (!botToken || !chatId) {
      console.error('❌ ОШИБКА: Отсутствуют BOT_TOKEN или CHAT_ID в Vercel Environment Variables');
      return res.status(500).json({ 
        success: false, 
        error: 'Сервер не настроен. Отсутствуют TELEGRAM_BOT_TOKEN или TELEGRAM_CHAT_ID' 
      });
    }

    // ... [Остальная логика отправки сообщения, она у вас правильная] ...
    
    const message = `
🔔 <b>Новая заявка ReFork Capital</b>
👤 <b>Имя:</b> ${name}
📱 <b>Telegram:</b> ${telegram}
💰 <b>Пакет:</b> ${pkg}
🕐 <b>Время:</b> ${new Date().toLocaleString('ru-RU')}
    `.trim();

    console.log('📤 Отправляем в Telegram...');

    const telegramResponse = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML'
      })
    });

    const telegramData = await telegramResponse.json();

    if (telegramResponse.ok) {
      console.log('✅ Message sent successfully to:', telegram);
      res.status(200).json({ 
        success: true,
        message: '✅ Сигнал получен! Заявка принята.'
      });
    } else {
      console.error('❌ Ошибка Telegram API:', telegramData);
      res.status(500).json({ 
        success: false, 
        error: `Ошибка Telegram: ${telegramData.description || 'Неизвестная ошибка'}` 
      });
    }

  } catch (error) {
    console.error('💥 Ошибка сервера:', error);
    res.status(500).json({ 
      success: false, 
      error: `Внутренняя ошибка сервера: ${error.message}` 
    });
  }
};


