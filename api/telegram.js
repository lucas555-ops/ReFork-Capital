// /api/telegram.js
export default async function handler(req, res) {
  // ===== CORS WHITELIST =====
  const allowedOrigins = [
    'https://lucas555-ops.github.io',
    'https://reforkcapital.online',
    'http://localhost:3000'
  ];

  const origin = req.headers.origin || '';
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    console.log('🚫 Blocked origin:', origin);
  }

  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');
  res.setHeader('Access-Control-Max-Age', '86400');

  // Обрабатываем preflight-запрос
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
    console.log('✅ API call from:', origin);
    console.log('📨 Получен запрос:', req.body);

    const { name, telegram, package: pkg, lang = 'ru', source = 'ReFork Capital' } = req.body || {};

    if (!name || !telegram || !pkg) {
      return res.status(400).json({
        success: false,
        error: 'Отсутствуют обязательные поля'
      });
    }

    // Валидация Telegram
    const telegramPattern = /^@[A-Za-z0-9_]{5,32}$/;
    if (!telegramPattern.test(telegram)) {
      return res.status(400).json({
        success: false,
        error: 'Некорректный формат Telegram. Используйте @username'
      });
    }

    const botToken = process.env.TELEGRAM_BOT_TOKEN || process.env.BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID || process.env.CHAT_ID;

    if (!botToken || !chatId) {
      console.error('❌ Missing env vars');
      return res.status(500).json({
        success: false,
        error: 'Сервер не настроен. Отсутствует BOT_TOKEN или CHAT_ID'
      });
    }

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

    const tgRes = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML'
      })
    });

    const tgData = await tgRes.json();

    if (!tgRes.ok) {
      throw new Error(tgData.description || 'Telegram API error');
    }

    console.log('✅ Message sent successfully:', tgData);
    return res.status(200).json({
      success: true,
      message: '✅ Сигнал получен! Заявка принята.'
    });

  } catch (error) {
    console.error('💥 Ошибка сервера:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal Server Error'
    });
  }
}


