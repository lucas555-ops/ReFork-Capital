// /api/telegram.js
module.exports = async function handler(req, res) {
  // ===== CORS WHITELIST =====
  const allowedOrigins = [
    'https://lucas555-ops.github.io',
    'https://reforkcapital.online',
    'https://www.reforkcapital.online',
    'http://localhost:3000'
  ];
  
  const origin = req.headers.origin;

  // Проверяем origin
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    res.setHeader('Access-Control-Allow-Origin', '*');
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
    const { name, telegram, package: pkg, lang = 'ru', source = 'ReFork Capital' } = req.body;

    if (!name || !telegram || !pkg) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    const botToken = process.env.BOT_TOKEN;
    const chatId = process.env.CHAT_ID;

    const message = `
🔔 <b>Новая заявка ReFork Capital</b>

👤 <b>Имя:</b> ${name}
📱 <b>Telegram:</b> ${telegram}
💰 <b>Пакет:</b> ${pkg}
🌐 <b>Язык:</b> ${lang}
📍 <b>Источник:</b> ${source}
🕐 <b>Время:</b> ${new Date().toLocaleString('ru-RU')}
    `.trim();

    const telegramResponse = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: message, parse_mode: 'HTML' })
    });

    if (telegramResponse.ok) {
      res.status(200).json({ success: true, message: '✅ Сигнал получен! Заявка принята.' });
    } else {
      res.status(500).json({ success: false, error: 'Ошибка при отправке в Telegram' });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
