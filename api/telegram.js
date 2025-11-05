module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method not allowed' });

  try {
    const { name, telegram, package: pkg } = req.body || {};
    if (!name || !telegram || !pkg) return res.status(400).json({ success: false, error: 'Missing fields' });

    const botToken = process.env.BOT_TOKEN;
    const chatId = process.env.CHAT_ID;
    if (!botToken || !chatId) return res.status(500).json({ success: false, error: 'Missing env variables' });

    const message = `🔔 New Lead\n👤 ${name}\n📱 ${telegram}\n💰 ${pkg}`;
    const tg = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: message })
    });

    if (!tg.ok) throw new Error('Telegram API error');
    res.status(200).json({ success: true, message: '✅ Sent successfully!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
};
