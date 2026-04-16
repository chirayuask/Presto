import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import * as ctrl from '../controllers/stationController.js';
import {
  createStationBody,
  updateStationBody,
  listStationsQuery,
} from '../validators/station.js';
import { idParams } from '../validators/common.js';

export const stationsRouter = Router();

stationsRouter.get('/', validate({ query: listStationsQuery }), ctrl.list);
stationsRouter.get('/:id', validate({ params: idParams }), ctrl.get);
stationsRouter.post('/', validate({ body: createStationBody }), ctrl.create);
stationsRouter.patch('/:id', validate({ params: idParams, body: updateStationBody }), ctrl.update);
stationsRouter.delete('/:id', validate({ params: idParams }), ctrl.remove);
