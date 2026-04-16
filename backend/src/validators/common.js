import { z } from 'zod';
import { IANAZone } from 'luxon';

export const uuid = z.string().uuid('Must be a valid UUID');

export const idParams = z.object({ id: uuid });

export const ianaTimezone = z
  .string()
  .min(1)
  .refine((v) => IANAZone.isValidZone(v), { message: 'Must be a valid IANA timezone' });

export const timeHHMM = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Must be HH:mm (00:00 - 23:59)');

export const dateISO = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD');

export const currencyCode = z
  .string()
  .regex(/^[A-Z]{3}$/, 'Must be a 3-letter uppercase currency code');

export const pricePerKwh = z.number().nonnegative('Price must be >= 0');
