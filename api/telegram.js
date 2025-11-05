module.exports = async function handler(req, res) {
  // Включаем CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Обрабатываем OPTIONS запросы для CORS
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Разрешаем только POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('Получен запрос:', req.body);

    const { name, telegram, package } = req.body;

    // Проверяем обязательные поля
    if (!name || !telegram || !package) {
      return res.status(400).json({ 
        success: false, 
        error: 'Отсутствуют обязательные поля' 
      });
    }

    // Получаем переменные окружения
    const botToken = process.env.BOT_TOKEN;
    const chatId = process.env.CHAT_ID;

    console.log('BOT_TOKEN exists:', !!botToken);
    console.log('CHAT_ID exists:', !!chatId);

    // Проверяем наличие переменных окружения
    if (!botToken || !chatId) {
      console.error('Missing environment variables');
      return res.status(500).json({ 
        success: false, 
        error: 'Сервер не настроен. Отсутствуют BOT_TOKEN или CHAT_ID' 
      });
    }

    // Формируем сообщение
    const message = `🎯 <b>Новая заявка ReFork Capital</b>\n\n` +
                   `👤 <b>Имя:</b> ${name}\n` +
                   `📱 <b>Telegram:</b> ${telegram}\n` +
                   `💰 <b>Пакет:</b> ${package}\n` +
                   `⏰ <b>Время:</b> ${new Date().toLocaleString('ru-RU')}`;

    console.log('Отправляем в Telegram...');

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
    console.log('Ответ от Telegram API:', telegramData);

    if (telegramResponse.ok) {
      res.status(200).json({ 
  success: true,
  message: '✅ Сигнал получен! Заявка принята.'
});
    } else {
      console.error('Ошибка Telegram API:', telegramData);
      res.status(500).json({ 
        success: false, 
        error: `Ошибка Telegram: ${telegramData.description || 'Неизвестная ошибка'}` 
      });
    }

  } catch (error) {
    console.error('Ошибка сервера:', error);
    res.status(500).json({ 
      success: false, 
      error: `Внутренняя ошибка сервера: ${error.message}` 
    });
  }
};



