export default async function handler(req, res) {
  // Разрешаем запросы с любого домена (CORS)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Обрабатываем предварительные OPTIONS запросы
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Разрешаем только POST запросы
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Получаем данные из запроса
    const { name, telegram, package } = req.body;

    // Проверяем обязательные поля
    if (!name || !telegram || !package) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields: name, telegram, package' 
      });
    }

    // === НАСТРОЙКИ БОТА ===
    // ЗАМЕНИТЕ эти значения на свои!
    const botToken = '7100123456:AAHabcdefghijklmnopqrstuvwxyz123456';
    const chatId = '-1001234567890';
    
    // Формируем сообщение
    const message = `🎯 <b>Новая заявка ReFork Capital</b>\n\n` +
                   `👤 <b>Имя:</b> ${name}\n` +
                   `📱 <b>Telegram:</b> ${telegram}\n` +
                   `💰 <b>Пакет:</b> ${package}\n` +
                   `⏰ <b>Время:</b> ${new Date().toLocaleString('ru-RU')}\n` +
                   `🌐 <b>Источник:</b> Лендинг`;

    // Отправляем сообщение в Telegram
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

    if (telegramResponse.ok) {
      // Успешная отправка
      res.status(200).json({ 
        success: true,
        message: 'Заявка успешно отправлена!'
      });
    } else {
      // Ошибка Telegram API
      console.error('Telegram API Error:', telegramData);
      res.status(500).json({ 
        success: false, 
        error: 'Ошибка отправки в Telegram: ' + (telegramData.description || 'Unknown error')
      });
    }

  } catch (error) {
    // Ошибка сервера
    console.error('Server Error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Внутренняя ошибка сервера: ' + error.message 
    });
  }
}