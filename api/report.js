export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;
  if (!WEBHOOK_URL) {
    return res.status(500).json({ error: 'Discord webhook URL not configured' });
  }

  try {
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body)
    });

    if (response.ok) {
      res.status(200).json({ success: true });
    } else {
      const errorText = await response.text();
      res.status(response.status).json({ error: 'Failed to send to Discord', details: errorText });
    }
  } catch (error) {
    console.error('Discord Report Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
