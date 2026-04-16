import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import * as ctrl from '../controllers/bulkController.js';
import { bulkByChargersBody, bulkByStationsBody } from '../validators/bulk.js';

export const bulkRouter = Router();

bulkRouter.post('/', validate({ body: bulkByChargersBody }), ctrl.applyByChargers);
bulkRouter.post('/by-station', validate({ body: bulkByStationsBody }), ctrl.applyByStations);
