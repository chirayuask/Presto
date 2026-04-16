import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import * as ctrl from '../controllers/chargerController.js';
import { createChargerBody, updateChargerBody, listChargersQuery } from '../validators/charger.js';
import { idParams } from '../validators/common.js';

export const chargersRouter = Router();

chargersRouter.get('/', validate({ query: listChargersQuery }), ctrl.list);
chargersRouter.get('/:id', validate({ params: idParams }), ctrl.get);
chargersRouter.post('/', validate({ body: createChargerBody }), ctrl.create);
chargersRouter.patch('/:id', validate({ params: idParams, body: updateChargerBody }), ctrl.update);
chargersRouter.delete('/:id', validate({ params: idParams }), ctrl.remove);
