import { Router } from 'express';
import { sequelize } from '../models/index.js';

export const healthRouter = Router();

healthRouter.get('/', async (_req, res) => {
  const started = Date.now();
  let dbStatus = 'up';
  try {
    await sequelize.authenticate();
  } catch {
    dbStatus = 'down';
  }

  const allOk = dbStatus === 'up';
  res.status(allOk ? 200 : 503).json({
    status: allOk ? 'ok' : 'degraded',
    uptimeSeconds: Math.round(process.uptime()),
    latencyMs: Date.now() - started,
    checks: {
      database: dbStatus,
    },
    timestamp: new Date().toISOString(),
  });
});
