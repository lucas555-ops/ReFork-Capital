// /api/telegram.js
module.exports = async function handler(req, res) {
  // Берем список доменов из переменной окружения и преобразуем в массив
  // Переменная должна содержать домены, разделенные запятыми, например:
  // "https://reforkcapital.online,https://staging.reforkcapital.online"
  const corsOriginEnv = process.env.CORS_ORIGIN || '';
  const allowedOrigins = corsOriginEnv.split(',').map(s => s.trim()).filter(s => s.length > 0);
  
  // Добавляем домен Vercel для предпросмотра, если это нужно для тестирования
  // allowedOrigins.push(req.headers.host); 
  
  const origin = req.headers.origin;
  
  // Проверяем origin и устанавливаем соответствующий заголовок
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else if (allowedOrigins.length === 0 && origin) {
     // Если список пуст, но origin есть (отключаем CORS, если нужно)
     // res.setHeader('Access-Control-Allow-Origin', '*'); 
  } else {
    console.log('🚫 Blocked origin:', origin);
    return res.status(403).json({ 
      success: false, 
      error: 'Origin not allowed' 
    });
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');
  res.setHeader('Access-Control-Max-Age', '86400');

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

  // ===== ОБРАБОТКА ТЕЛА ЗАПРОСА (JSON PARSE) =====
  let body;
  try {
      body = JSON.parse(req.body); // Vercel иногда оставляет тело строкой
  } catch (e) {
      body = req.body; // Если не JSON, возможно, это уже объект
  }

  const { name, telegram, package: pkg, lang = 'ru', source = 'unknown' } = body;
  
  // Проверка на наличие обязательных полей
  if (!name || !telegram || !pkg) {
    return res.status(400).json({ 
      success: false, 
      error: 'Missing required fields (name, telegram, package)' 
    });
  }
  
  // Переменные для Telegram (ОНИ ТОЖЕ ДОЛЖНЫ БЫТЬ В ENV!)
  const botToken = process.env.BOT_TOKEN; 
  const chatId = process.env.CHAT_ID;
  
  if (!botToken || !chatId) {
      console.error('❌ Missing BOT_TOKEN or CHAT_ID in Environment Variables!');
      return res.status(500).json({ success: false, error: 'Server configuration error.' });
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
      error: 'Ошибка при отправке в Telegram. См. логи Vercel.' 
    });
  }
}
