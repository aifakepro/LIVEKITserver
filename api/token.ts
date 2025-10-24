// /api/start-agent.js
export default async function handler(req, res) {
  const response = await fetch('https://api.livekit.cloud/agents/sessions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.LIVEKIT_CLOUD_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      agent_id: 'CA_i6Hdc5v37QVn',
      room: req.query.room || 'StopAIFake'
    })
  });

  const data = await response.json();
  res.status(200).json(data);
}

