import { z } from 'zod';
import { uuid } from './common.js';

export const createChargerBody = z.object({
  stationId: uuid,
  serialNumber: z.string().min(1).max(100),
  label: z.string().max(200).optional().nullable(),
  connectorType: z.string().max(50).optional().nullable(),
  powerKw: z.number().positive().optional().nullable(),
});

export const updateChargerBody = createChargerBody.partial();

export const listChargersQuery = z.object({
  stationId: uuid.optional(),
  search: z.string().optional(),
});
