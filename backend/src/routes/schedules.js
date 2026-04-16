import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate.js';
import * as ctrl from '../controllers/scheduleController.js';
import {
  createScheduleBody,
  updateScheduleBody,
  replacePeriodsBody,
  cloneScheduleBody,
} from '../validators/schedule.js';
import { idParams, uuid } from '../validators/common.js';

export const chargerScheduleRouter = Router({ mergeParams: true });
chargerScheduleRouter.get(
  '/schedules',
  validate({ params: z.object({ chargerId: uuid }) }),
  ctrl.listForCharger,
);
chargerScheduleRouter.post(
  '/schedules',
  validate({ params: z.object({ chargerId: uuid }), body: createScheduleBody }),
  ctrl.create,
);

export const schedulesRouter = Router();
schedulesRouter.get('/:id', validate({ params: idParams }), ctrl.get);
schedulesRouter.patch('/:id', validate({ params: idParams, body: updateScheduleBody }), ctrl.update);
schedulesRouter.put(
  '/:id/periods',
  validate({ params: idParams, body: replacePeriodsBody }),
  ctrl.replacePeriods,
);
schedulesRouter.delete('/:id', validate({ params: idParams }), ctrl.remove);
schedulesRouter.post(
  '/:id/clone',
  validate({ params: idParams, body: cloneScheduleBody }),
  ctrl.clone,
);
