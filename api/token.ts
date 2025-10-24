export default async function handler(req, res) {
  // CORS заголовки (если нужно)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const roomName = req.query.room || 'StopAIFake';
    
    console.log('Starting agent for room:', roomName);
    
    // Проверка API ключа
    if (!process.env.LIVEKIT_CLOUD_API_KEY) {
      console.error('LIVEKIT_CLOUD_API_KEY not set!');
      return res.status(500).json({ 
        error: 'Server configuration error',
        details: 'API key not configured'
      });
    }

    const response = await fetch('https://api.livekit.cloud/agents/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.LIVEKIT_CLOUD_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        agent_id: 'CA_i6Hdc5v37QVn',
        room: roomName
      })
    });

    const data = await response.json();
    
    // Проверка статуса ответа
    if (!response.ok) {
      console.error('LiveKit API error:', response.status, data);
      return res.status(response.status).json({
        error: 'Failed to start agent',
        details: data,
        status: response.status
      });
    }

    console.log('Agent started successfully:', data);
    return res.status(200).json(data);
    
  } catch (error) {
    console.error('Error starting agent:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
}

