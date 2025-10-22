// /api/token.js
import { AccessToken, RoomGrant } from 'livekit-server-sdk';

export default function handler(req, res) {
  const API_KEY = process.env.LIVEKIT_API_KEY;
  const API_SECRET = process.env.LIVEKIT_API_SECRET;
  const roomName = req.query.room || 'default';

  const at = new AccessToken(API_KEY, API_SECRET, { identity: 'user-' + Math.floor(Math.random()*1000) });
  const grant = new RoomGrant({ room: roomName });
  at.addGrant(grant);

  res.status(200).json({ token: at.toJwt() });
}

