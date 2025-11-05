import fetch from "node-fetch";

export default async function handler(req, res) {
  const allowedOrigins = [
    'https://lucas555-ops.github.io',
    'https://reforkcapital.online',
    'https://www.reforkcapital.online',
    'http://localhost:3000',
    'https://re-fork-capital.vercel.app'
  ];

  const origin = req.headers.origin || req.headers.referer;
  
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');
  res.setHeader('Access-Control-Max-Age', '86400');

  if (origin && allowedOrigins.some(allowed => origin.includes(allowed.replace('www.', '')))) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method not allowed' });

  try {
    console.log('✅ API call from origin:', origin);
    console.log('📨 Получен запрос:', req.body);

    let body;
    try {
      body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    } catch {
      body = req.body;
    }

    const { name, telegram, package: pkg, lang = 'ru', source = 'ReFork Capital' } = body;

    if (!name || !telegram || !pkg)
      return res.status(400).json({ success: false, error: 'Отсутствуют обязательные поля' });

    const telegramPattern = /^@[A-Za-z0-9_]{5,32}$/;
    if (!telegramPattern.test(telegram))
      return res.status(400).json({ success: false, error: 'Invalid Telegram format. Use @username format' });

    const botToken = process.env.BOT_TOKEN;
    const chatId = process.env.CHAT_ID;

    if (!botToken || !chatId)
      return res.status(500).json({ success: false, error: 'Missing BOT_TOKEN or CHAT_ID' });

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
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML'
      })
    });

    const telegramData = await telegramResponse.json();

    if (telegramResponse.ok)
      return res.status(200).json({ success: true, message: '✅ Заявка отправлена!' });

    console.error('❌ Telegram API error:', telegramData);
    return res.status(500).json({ success: false, error: telegramData.description || 'Telegram API error' });

  } catch (error) {
    console.error('💥 Ошибка сервера:', error);
    return res.status(500).json({ success: false, error: `Server error: ${error.message}` });
  }
}
