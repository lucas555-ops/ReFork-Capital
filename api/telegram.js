// /api/telegram.js
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');
  res.setHeader('Access-Control-Max-Age', '86400');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST')
    return res.status(405).json({ success: false, error: 'Method not allowed' });

  let body;
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  } catch {
    return res.status(400).json({ success: false, error: 'Invalid JSON body' });
  }

  // Honeypot protection
  if (body.website) {
    console.log('🤖 Bot detected - honeypot triggered');
    return res.status(200).json({ success: true, message: '✅ Сигнал получен!' });
  }

  // ✅ ИСПРАВЛЕНО: используем переданные значения без defaults
  const { name, telegram, package: pkg, lang, source } = body;
  
  // Required fields validation
  if (!name || !telegram || !pkg)
    return res.status(400).json({ success: false, error: 'Missing required fields' });

  // Telegram format validation
  const telegramRegex = /^@[A-Za-z0-9_]{5,32}$/;
  if (!telegramRegex.test(telegram)) {
    return res.status(400).json({ 
      success: false, 
      error: 'Invalid telegram format' 
    });
  }

  const botToken = process.env.BOT_TOKEN;
  const chatId = process.env.CHAT_ID;
  if (!botToken || !chatId)
    return res.status(500).json({ success: false, error: 'Missing BOT_TOKEN or CHAT_ID' });

  // ✅ ИСПРАВЛЕНО: используем реальные значения из формы
  const message = `
<b>Новая заявка ReFork Capital</b>

👤 <b>Имя:</b> ${name}
📱 <b>Telegram:</b> ${telegram}
💰 <b>Пакет:</b> ${pkg}
🌐 <b>Язык:</b> ${lang}
📍 <b>Источник:</b> ${source}
🕐 <b>Время:</b> ${new Date().toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' })}
`.trim();

  const tgRes = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text: message, parse_mode: 'HTML' }),
  });

  const tgData = await tgRes.json();
  if (!tgRes.ok)
    return res.status(500).json({ success: false, error: tgData.description || 'Telegram error' });

  return res.status(200).json({ success: true, message: '✅ Сигнал получен!' });
}
