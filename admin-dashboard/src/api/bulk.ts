import { apiRaw } from './client';
import type { BulkReport } from '@/types/api';
import type { PeriodInput } from './schedules';

export interface BulkScheduleTemplate {
  name?: string | null;
  currency: string;
  effectiveFrom: string;
  periods: PeriodInput[];
}

export const bulkApplyByChargers = (body: {
  chargerIds: string[];
  schedule: BulkScheduleTemplate;
  activateImmediately?: boolean;
}) => apiRaw<BulkReport>('/pricing/bulk', { method: 'POST', body: JSON.stringify(body) });

export const bulkApplyByStations = (body: {
  stationIds: string[];
  schedule: BulkScheduleTemplate;
  activateImmediately?: boolean;
}) => apiRaw<BulkReport>('/pricing/bulk/by-station', {
  method: 'POST',
  body: JSON.stringify(body),
});
