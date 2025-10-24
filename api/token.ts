export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const roomName = req.query.room || 'StopAIFake';
    const participantName = req.query.name || `user_${Date.now()}`;
    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;

    if (!apiKey || !apiSecret) {
      return res.status(500).json({ 
        error: 'Missing credentials',
        details: {
          hasApiKey: !!apiKey,
          hasApiSecret: !!apiSecret
        }
      });
    }

    console.log('Generating token:', { roomName, participantName });

    // Создаем токен вручную (без библиотеки)
    const header = {
      alg: 'HS256',
      typ: 'JWT'
    };

    const now = Math.floor(Date.now() / 1000);
    const payload = {
      exp: now + 86400, // 24 часа
      iss: apiKey,
      nbf: now,
      sub: participantName,
      video: {
        room: roomName,
        roomJoin: true,
        canPublish: true,
        canSubscribe: true
      }
    };

    // Простое создание JWT
    const encoder = new TextEncoder();
    const base64url = (str) => {
      return Buffer.from(str).toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
    };

    const headerEncoded = base64url(JSON.stringify(header));
    const payloadEncoded = base64url(JSON.stringify(payload));
    const signatureInput = `${headerEncoded}.${payloadEncoded}`;

    const crypto = require('crypto');
    const signature = crypto
      .createHmac('sha256', apiSecret)
      .update(signatureInput)
      .digest('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');

    const token = `${signatureInput}.${signature}`;

    console.log('Token generated successfully');

    return res.status(200).json({ 
      token,
      room: roomName,
      identity: participantName
    });

  } catch (error) {
    console.error('Token error:', error);
    return res.status(500).json({ 
      error: error.message,
      stack: error.stack
    });
  }
}
