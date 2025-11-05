// /api/telegram.js
export default async function handler(req, res) {
  // CORS: разрешаем с любых доменов (для простоты)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');
  res.setHeader('Access-Control-Max-Age', '86400');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  // безопасный парсинг тела
  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch (e) {
      console.error('Invalid JSON body:', e);
      return res.status(400).json({ success: false, error: 'Invalid JSON' });
    }
  }

  const { name, telegram, package: pkg, lang = 'ru', source = 'ReFork Capital' } = body || {};

  if (!name || !telegram || !pkg) {
    return res.status(400).json({
      success: false,
      error: 'Missing required fields (name, telegram, package)'
    });
  }

  // Валидация telegram формата (базовая)
  const telegramPattern = /^@[A-Za-z0-9_]{5,32}$/;
  if (!telegramPattern.test(telegram)) {
    return res.status(400).json({ success: false, error: 'Invalid Telegram format' });
  }

  const botToken = process.env.BOT_TOKEN;
  const chatId = process.env.CHAT_ID;
  if (!botToken || !chatId) {
    console.error('Missing BOT_TOKEN or CHAT_ID in env');
    return res.status(500).json({ success: false, error: 'Server not configured' });
  }

  const message = `
🔔 <b>Новая заявка ReFork Capital</b>

👤 <b>Имя:</b> ${name}
📱 <b>Telegram:</b> ${telegram}
💰 <b>Пакет:</b> ${pkg}
🕐 <b>Время:</b> ${new Date().toLocaleString('ru-RU')}
`.trim();

  try {
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
    console.log('Telegram response:', tgData);

    if (!tgRes.ok) {
      return res.status(500).json({ success: false, error: tgData.description || 'Telegram API error' });
    }

    return res.status(200).json({ success: true, message: '✅ Сигнал получен! Заявка принята.' });
  } catch (err) {
    console.error('Error sending to Telegram:', err);
    return res.status(500).json({ success: false, error: 'Internal error' });
  }
}
