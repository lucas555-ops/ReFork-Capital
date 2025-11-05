module.exports = async function handler(req, res) {
  console.log('🚀 API вызван, метод:', req.method);
  console.log('📍 Origin:', req.headers.origin);
  
  // ===== CORS =====
  const allowedOrigins = [
    'https://lucas555-ops.github.io',
    'https://reforkcapital.online',
    'https://www.reforkcapital.online',
    'https://re-fork-capital.vercel.app',
    'http://localhost:3000'
  ];
  
  const origin = req.headers.origin;
  
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    res.setHeader('Access-Control-Allow-Origin', '*'); // Временно для теста
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  // OPTIONS запрос
  if (req.method === 'OPTIONS') {
    console.log('✅ OPTIONS запрос обработан');
    return res.status(200).end();
  }

  // Только POST
  if (req.method !== 'POST') {
    console.log('❌ Неверный метод:', req.method);
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed. Use POST.' 
    });
  }

  try {
    console.log('📨 Body:', req.body);

    const { name, telegram, package: pkg } = req.body;

    // Валидация
    if (!name || !telegram || !pkg) {
      console.log('❌ Отсутствуют поля');
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields' 
      });
    }

    // Проверка Telegram формата
    const telegramPattern = /^@[A-Za-z0-9_]{5,32}$/;
    if (!telegramPattern.test(telegram)) {
      console.log('❌ Неверный формат Telegram');
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid Telegram format' 
      });
    }

    // Переменные окружения
    const botToken = process.env.BOT_TOKEN;
    const chatId = process.env.CHAT_ID;

    console.log('🔑 BOT_TOKEN существует:', !!botToken);
    console.log('🔑 CHAT_ID существует:', !!chatId);

    if (!botToken || !chatId) {
      console.error('❌ Отсутствуют env переменные');
      return res.status(500).json({ 
        success: false, 
        error: 'Server configuration error' 
      });
    }

    // Формируем сообщение
    const message = `
🔔 <b>Новая заявка ReFork Capital</b>

👤 <b>Имя:</b> ${name}
📱 <b>Telegram:</b> ${telegram}
💰 <b>Пакет:</b> ${pkg}
🕐 <b>Время:</b> ${new Date().toLocaleString('ru-RU')}
    `.trim();

    console.log('📤 Отправляем в Telegram...');

    // Отправка в Telegram
    const telegramResponse = await fetch(
      `https://api.telegram.org/bot${botToken}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: 'HTML'
        })
      }
    );

    const telegramData = await telegramResponse.json();
    console.log('📩 Ответ Telegram:', telegramData);

    if (telegramResponse.ok) {
      console.log('✅ Успешно отправлено');
      return res.status(200).json({ 
        success: true,
        message: 'Message sent successfully'
      });
    } else {
      console.error('❌ Ошибка Telegram API:', telegramData);
      return res.status(500).json({ 
        success: false, 
        error: `Telegram error: ${telegramData.description}` 
      });
    }

  } catch (error) {
    console.error('💥 Серверная ошибка:', error);
    return res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
}
