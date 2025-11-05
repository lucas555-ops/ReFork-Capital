module.exports = async function handler(req, res) {
  // ===== CORS НАСТРОЙКА =====
  const allowedOrigins = [
    'https://lucas555-ops.github.io',
    'https://reforkcapital.online',
    'https://www.reforkcapital.online',
    'http://localhost:3000',
    'https://re-fork-capital.vercel.app'
  ];
  if (origin && allowedOrigins.some(allowed => origin.includes(allowed.replace('www.', '')))) {

  
  const origin = req.headers.origin || req.headers.referer;
  
  if (allowedOrigins.some(allowed => origin?.includes(allowed))) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed' 
    });
  }


  try {
    console.log('✅ API call from allowed origin:', origin);
    console.log('📨 Получен запрос:', req.body);

    const { name, telegram, package: pkg, lang = 'ru', source = 'ReFork Capital' } = req.body;

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

    // Получаем переменные окружения (обновленные имена)
    // Получаем переменные окружения
    const botToken = process.env.BOT_TOKEN;
    const chatId = process.env.CHAT_ID;

    console.log('BOT_TOKEN exists:', !!botToken);
    console.log('CHAT_ID exists:', !!chatId);

    // Проверяем наличие переменных окружения
    if (!botToken || !chatId) {
      console.error('❌ Missing environment variables');
      return res.status(500).json({ 
        success: false, 
        error: 'Сервер не настроен. Отсутствуют BOT_TOKEN или CHAT_ID' 
      });
    }

    // ===== ФОРМИРУЕМ УЛУЧШЕННОЕ СООБЩЕНИЕ =====
    const message = `
🔔 <b>Новая заявка ReFork Capital</b>

👤 <b>Имя:</b> ${name}
📱 <b>Telegram:</b> ${telegram}
💰 <b>Пакет:</b> ${pkg}
🌐 <b>Язык:</b> ${lang}
📍 <b>Источник:</b> ${source}
🕐 <b>Время:</b> ${new Date().toLocaleString('ru-RU')}
    `.trim();

    console.log('📤 Отправляем в Telegram...');

    // Отправляем в Telegram
    const telegramResponse = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML'
      })
    });

    const telegramData = await telegramResponse.json();
    console.log('📩 Ответ от Telegram API:', telegramData);

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
