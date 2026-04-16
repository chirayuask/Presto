import { Router } from 'express';
import { healthRouter } from './health.js';
import { stationsRouter } from './stations.js';
import { chargersRouter } from './chargers.js';
import { chargerPricingRouter } from './pricing.js';
import { chargerScheduleRouter, schedulesRouter } from './schedules.js';
import { timezonesRouter } from './timezones.js';
import { bulkRouter } from './bulk.js';

export const apiRouter = Router();

apiRouter.use('/health', healthRouter);
apiRouter.use('/timezones', timezonesRouter);
apiRouter.use('/stations', stationsRouter);
apiRouter.use('/chargers', chargersRouter);
apiRouter.use('/chargers/:chargerId', chargerPricingRouter);
apiRouter.use('/chargers/:chargerId', chargerScheduleRouter);
apiRouter.use('/schedules', schedulesRouter);
apiRouter.use('/pricing/bulk', bulkRouter);
