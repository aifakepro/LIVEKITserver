import { AccessToken } from 'livekit-server-sdk';

export default function handler(req, res) {
  const API_KEY = process.env.LIVEKIT_API_KEY;
  const API_SECRET = process.env.LIVEKIT_API_SECRET;
  const roomName = req.query.room || 'default';

  const at = new AccessToken(API_KEY, API_SECRET, {
    identity: 'user-' + Math.floor(Math.random() * 1000),
  });

  at.addGrant({ roomJoin: true, room: roomName });
  const token = at.toJwt();

  res.status(200).json({ token });
}
