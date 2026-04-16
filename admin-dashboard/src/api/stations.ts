import { api } from './client';
import type { Station } from '@/types/api';

export interface StationInput {
  name: string;
  timezone: string;
  address?: string | null;
}

export const listStations = (params?: { timezone?: string; search?: string }) => {
  const qs = new URLSearchParams();
  if (params?.timezone) qs.set('timezone', params.timezone);
  if (params?.search) qs.set('search', params.search);
  const q = qs.toString();
  return api<Station[]>(`/stations${q ? `?${q}` : ''}`);
};

export const getStation = (id: string) => api<Station>(`/stations/${id}`);

export const createStation = (body: StationInput) =>
  api<Station>('/stations', { method: 'POST', body: JSON.stringify(body) });

export const updateStation = (id: string, body: Partial<StationInput>) =>
  api<Station>(`/stations/${id}`, { method: 'PATCH', body: JSON.stringify(body) });

export const deleteStation = (id: string) =>
  api<void>(`/stations/${id}`, { method: 'DELETE' });
