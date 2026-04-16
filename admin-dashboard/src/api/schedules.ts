import { api } from './client';
import type { CurrentPrice, DailySchedule, PricingSchedule } from '@/types/api';

export interface PeriodInput {
  startTime: string;
  endTime: string;
  pricePerKwh: number;
}

export interface ScheduleInput {
  name?: string | null;
  currency: string;
  effectiveFrom: string;
  isActive?: boolean;
  periods: PeriodInput[];
}

export const listSchedulesForCharger = (chargerId: string) =>
  api<PricingSchedule[]>(`/chargers/${chargerId}/schedules`);

export const createSchedule = (chargerId: string, body: ScheduleInput) =>
  api<PricingSchedule>(`/chargers/${chargerId}/schedules`, {
    method: 'POST',
    body: JSON.stringify(body),
  });

export const getSchedule = (id: string) => api<PricingSchedule>(`/schedules/${id}`);

export const updateSchedule = (
  id: string,
  body: Partial<Pick<ScheduleInput, 'name' | 'currency' | 'effectiveFrom' | 'isActive'>>,
) => api<PricingSchedule>(`/schedules/${id}`, { method: 'PATCH', body: JSON.stringify(body) });

export const replaceSchedulePeriods = (id: string, periods: PeriodInput[]) =>
  api<PricingSchedule>(`/schedules/${id}/periods`, {
    method: 'PUT',
    body: JSON.stringify({ periods }),
  });

export const deleteSchedule = (id: string) =>
  api<void>(`/schedules/${id}`, { method: 'DELETE' });

export const cloneSchedule = (
  id: string,
  body: { targetChargerId?: string; effectiveFrom?: string; isActive?: boolean },
) => api<PricingSchedule>(`/schedules/${id}/clone`, { method: 'POST', body: JSON.stringify(body) });

export const getCurrentPrice = (chargerId: string, at?: string) => {
  const qs = at ? `?at=${encodeURIComponent(at)}` : '';
  return api<CurrentPrice>(`/chargers/${chargerId}/pricing/current${qs}`);
};

export const getDailySchedule = (chargerId: string, date?: string) => {
  const qs = date ? `?date=${date}` : '';
  return api<DailySchedule>(`/chargers/${chargerId}/pricing/schedule${qs}`);
};
