import { z } from 'zod';
import { currencyCode, dateISO, pricePerKwh, timeHHMM, uuid } from './common.js';

export const periodInput = z.object({
  startTime: timeHHMM,
  endTime: timeHHMM,
  pricePerKwh,
});

export const createScheduleBody = z.object({
  name: z.string().max(200).optional().nullable(),
  currency: currencyCode.default('USD'),
  effectiveFrom: dateISO,
  isActive: z.boolean().optional().default(true),
  periods: z.array(periodInput).min(1),
});

export const updateScheduleBody = z.object({
  name: z.string().max(200).optional().nullable(),
  currency: currencyCode.optional(),
  effectiveFrom: dateISO.optional(),
  isActive: z.boolean().optional(),
});

export const replacePeriodsBody = z.object({
  periods: z.array(periodInput).min(1),
});

export const cloneScheduleBody = z.object({
  targetChargerId: uuid.optional(),
  effectiveFrom: dateISO.optional(),
  isActive: z.boolean().optional(),
});
