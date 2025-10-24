import { AccessToken } from 'livekit-server-sdk';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const roomName = req.query.room || process.env.ROOM || 'StopAIFake';
    const participantName = req.query.name || `user_${Date.now()}`;

    if (!process.env.LIVEKIT_API_KEY || !process.env.LIVEKIT_API_SECRET) {
      return res.status(500).json({ error: 'Server not configured' });
    }

    // Запуск агента в комнате
    const response = await fetch('https://api.livekit.cloud/agents/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.LIVEKIT_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        agent_id: process.env.AGENT_ID,
        room: roomName
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Agent start error:', data);
    }

    // Создание токена для клиента
    const at = new AccessToken(
      process.env.LIVEKIT_API_KEY,
      process.env.LIVEKIT_API_SECRET,
      {
        identity: participantName,
      }
    );

    at.addGrant({
      room: roomName,
      roomJoin: true,
      canPublish: true,
      canSubscribe: true,
    });

    const token = at.toJwt();

    return res.status(200).json({ 
      token,
      room: roomName
    });

  } catch (error) {
    console.error('Server error:', error);
    return res.status(500).json({ 
      error: error.message 
    });
  }
}
