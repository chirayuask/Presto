import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import {
  getCurrentPriceHandler,
  getDailyScheduleHandler,
} from '../controllers/pricingController.js';
import {
  getCurrentPriceParams,
  getCurrentPriceQuery,
  getScheduleParams,
  getScheduleQuery,
} from '../validators/pricing.js';

export const chargerPricingRouter = Router({ mergeParams: true });

chargerPricingRouter.get(
  '/pricing/current',
  validate({ params: getCurrentPriceParams, query: getCurrentPriceQuery }),
  getCurrentPriceHandler,
);

chargerPricingRouter.get(
  '/pricing/schedule',
  validate({ params: getScheduleParams, query: getScheduleQuery }),
  getDailyScheduleHandler,
);
