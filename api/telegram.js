// api/telegram.js
module.exports = async (req, res) => {
  // Разрешаем CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');
  
  // Обрабатываем OPTIONS запрос для CORS
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Разрешаем только POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { name, telegram, package: pkg } = req.body;

    // Базовая валидация
    if (!name || !telegram || !pkg) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Проверяем переменные окружения
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (!botToken || !chatId) {
      console.error('Missing environment variables');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    // Формируем сообщение
    const message = `
🔔 Новая заявка ReFork Capital
👤 Имя: ${name}
📱 Telegram: ${telegram}
💰 Пакет: ${pkg}
🕐 Время: ${new Date().toLocaleString('ru-RU')}
    `.trim();

    // Отправляем в Telegram
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
      res.status(200).json({ 
        success: true,
        message: '✅ Заявка успешно отправлена!'
      });
    } else {
      console.error('Telegram API error:', telegramData);
      res.status(500).json({ 
        error: `Telegram error: ${telegramData.description || 'Unknown error'}` 
      });
    }

  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ 
      error: `Internal server error: ${error.message}` 
    });
  }
};
