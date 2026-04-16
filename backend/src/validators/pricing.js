import { z } from 'zod';

const uuid = z.string().uuid('Must be a valid UUID');

export const getCurrentPriceParams = z.object({
  chargerId: uuid,
});

export const getCurrentPriceQuery = z.object({
  at: z
    .string()
    .datetime({ offset: true, message: 'at must be an ISO-8601 datetime (with offset or Z)' })
    .optional(),
});

export const getScheduleParams = z.object({
  chargerId: uuid,
});

export const getScheduleQuery = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'date must be YYYY-MM-DD')
    .optional(),
});
