export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
  };

  // Handle OPTIONS request
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const url = new URL(req.url);
    const roomName = url.searchParams.get('room') || process.env.ROOM || 'StopAIFake';

    const apiKey = process.env.LIVEKIT_API_KEY;
    const agentId = process.env.AGENT_ID;

    if (!apiKey || !agentId) {
      return new Response(JSON.stringify({ 
        error: 'Server not configured',
        details: 'Missing LIVEKIT_API_KEY or AGENT_ID' 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Запуск агента
    const response = await fetch('https://api.livekit.cloud/agents/dispatch', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        agent_name: agentId,
        room: roomName
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error('Agent start error:', data);
      return new Response(JSON.stringify({ 
        error: 'Failed to start agent',
        status: response.status,
        details: data 
      }), {
        status: response.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ 
      success: true,
      room: roomName,
      agent: data
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Server error:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      stack: error.stack
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}
