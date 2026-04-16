import { api } from './client';
import type { Charger, CurrentPrice, DailySchedule } from '@/types/api';

export const listChargers = () => api<Charger[]>('/chargers');

export const getCurrentPrice = (chargerId: string, at?: string) => {
  const qs = at ? `?at=${encodeURIComponent(at)}` : '';
  return api<CurrentPrice>(`/chargers/${chargerId}/pricing/current${qs}`);
};

export const getDailySchedule = (chargerId: string, date?: string) => {
  const qs = date ? `?date=${date}` : '';
  return api<DailySchedule>(`/chargers/${chargerId}/pricing/schedule${qs}`);
};
