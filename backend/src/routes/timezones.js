import { Router } from 'express';

const POPULAR_ZONES = [
  'Asia/Kolkata', 'Asia/Dubai', 'Asia/Singapore', 'Asia/Tokyo',
  'America/Los_Angeles', 'America/Denver', 'America/Chicago', 'America/New_York',
  'America/Sao_Paulo', 'America/Mexico_City',
  'Europe/London', 'Europe/Paris', 'Europe/Berlin', 'Europe/Amsterdam',
  'Australia/Sydney', 'Australia/Perth',
  'Africa/Johannesburg', 'Africa/Cairo',
  'UTC',
];

export const timezonesRouter = Router();

timezonesRouter.get('/', (_req, res) => {
  const now = new Date();
  const zones = POPULAR_ZONES.map((zone) => {
    const offsetFormatter = new Intl.DateTimeFormat('en-US', {
      timeZone: zone,
      timeZoneName: 'longOffset',
    });
    const parts = offsetFormatter.formatToParts(now);
    const offset = parts.find((p) => p.type === 'timeZoneName')?.value || '';
    return { zone, offset };
  });
  res.json({ data: zones });
});
