import crypto from 'crypto';

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
    const agentName = process.env.AGENT_NAME || 'voice-agent'; // используем AGENT_NAME вместо AGENT_ID

    if (!apiKey || !apiSecret || !agentName) {
      return res.status(500).json({ 
        error: 'Missing env variables',
        details: {
          hasApiKey: !!apiKey,
          hasApiSecret: !!apiSecret,
          hasAgentName: !!agentName
        }
      });
    }

    console.log('Starting agent:', { agentName, roomName });

    // Создаем JWT токен для API
    const header = { alg: 'HS256', typ: 'JWT' };
    const now = Math.floor(Date.now() / 1000);
    
    const payload = {
      iss: apiKey,
      exp: now + 600,
      nbf: now,
      video: {
        roomAdmin: true,
        room: roomName
      }
    };

    const base64url = (str) => {
      return Buffer.from(str)
        .toString('base64')
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

    // Вызов API LiveKit
    const apiUrl = 'https://api.livekit.cloud/v1/agent/dispatch/create_dispatch';
    
    console.log('Calling LiveKit API:', apiUrl);
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        agent_name: agentName,
        room: roomName,
        metadata: JSON.stringify({ 
          source: 'web-frontend',
          timestamp: new Date().toISOString()
        })
      })
    });

    const responseText = await response.text();
    console.log('LiveKit API Response:', { 
      status: response.status, 
      statusText: response.statusText,
      body: responseText.substring(0, 500)
    });

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
      console.error('Agent dispatch failed:', data);
      return res.status(response.status).json({ 
        error: 'Failed to dispatch agent',
        status: response.status,
        details: data 
      });
    }

    console.log('Agent dispatched successfully:', data);
    
    return res.status(200).json({ 
      success: true,
      room: roomName,
      agent: data,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Server error:', error);
    return res.status(500).json({ 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}
