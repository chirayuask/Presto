import { z } from 'zod';
import { currencyCode, dateISO, uuid } from './common.js';
import { periodInput } from './schedule.js';

const scheduleTemplate = z.object({
  name: z.string().max(200).optional().nullable(),
  currency: currencyCode.default('USD'),
  effectiveFrom: dateISO,
  periods: z.array(periodInput).min(1),
});

export const bulkByChargersBody = z
  .object({
    chargerIds: z.array(uuid).min(1).max(1000),
    schedule: scheduleTemplate,
    activateImmediately: z.boolean().optional().default(true),
  });

export const bulkByStationsBody = z
  .object({
    stationIds: z.array(uuid).min(1).max(200),
    schedule: scheduleTemplate,
    activateImmediately: z.boolean().optional().default(true),
  });
