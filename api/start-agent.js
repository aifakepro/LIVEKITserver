export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const roomName = req.query.room || 'StopAIFake';
    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;
    const agentId = process.env.AGENT_ID;

    if (!apiKey || !apiSecret || !agentId) {
      return res.status(500).json({ 
        error: 'Missing env variables',
        details: {
          hasApiKey: !!apiKey,
          hasApiSecret: !!apiSecret,
          hasAgentId: !!agentId
        }
      });
    }

    console.log('Starting agent:', { agentId, roomName });

    // Создаем JWT токен для API авторизации
    const crypto = require('crypto');
    
    const header = {
      alg: 'HS256',
      typ: 'JWT'
    };
    
    const now = Math.floor(Date.now() / 1000);
    const payload = {
      iss: apiKey,
      exp: now + 600, // 10 минут
      nbf: now,
      video: {
        roomAdmin: true,
        room: roomName
      }
    };

    const base64url = (str) => {
      return Buffer.from(str).toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
    };

    const headerEncoded = base64url(JSON.stringify(header));
    const payloadEncoded = base64url(JSON.stringify(payload));
    const signatureInput = `${headerEncoded}.${payloadEncoded}`;
    
    const signature = crypto
      .createHmac('sha256', apiSecret)
      .update(signatureInput)
      .digest('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
    
    const apiToken = `${signatureInput}.${signature}`;

    // Используем Bearer token с JWT
    const response = await fetch('https://api.livekit.cloud/v1/agent/dispatch/create_dispatch', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiToken}`, // JWT токен!
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        agent_name: agentId,
        room: roomName,
        metadata: JSON.stringify({ source: 'web-frontend' })
      })
    });

    const responseText = await response.text();
    console.log('API Response:', { status: response.status, body: responseText });

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.error('Failed to parse response:', responseText);
      return res.status(response.status).json({
        error: 'Invalid API response',
        status: response.status,
        body: responseText
      });
    }

    if (!response.ok) {
      console.error('Agent start failed:', data);
      return res.status(response.status).json({ 
        error: 'Failed to start agent',
        status: response.status,
        details: data 
      });
    }

    console.log('Agent started successfully:', data);
    return res.status(200).json({ 
      success: true,
      room: roomName,
      agent: data
    });

  } catch (error) {
    console.error('Server error:', error);
    return res.status(500).json({ 
      error: error.message,
      stack: error.stack
    });
  }
}
