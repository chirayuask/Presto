import { z } from 'zod';
import { ianaTimezone } from './common.js';

export const createStationBody = z.object({
  name: z.string().min(1).max(200),
  address: z.string().max(500).optional().nullable(),
  timezone: ianaTimezone,
});

export const updateStationBody = createStationBody.partial();

export const listStationsQuery = z.object({
  timezone: z.string().optional(),
  search: z.string().optional(),
});
