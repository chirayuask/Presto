import { api } from './client';
import type { Charger } from '@/types/api';

export interface ChargerInput {
  stationId: string;
  serialNumber: string;
  label?: string | null;
  connectorType?: string | null;
  powerKw?: number | null;
}

export const listChargers = (params?: { stationId?: string; search?: string }) => {
  const qs = new URLSearchParams();
  if (params?.stationId) qs.set('stationId', params.stationId);
  if (params?.search) qs.set('search', params.search);
  const q = qs.toString();
  return api<Charger[]>(`/chargers${q ? `?${q}` : ''}`);
};

export const getCharger = (id: string) => api<Charger>(`/chargers/${id}`);

export const createCharger = (body: ChargerInput) =>
  api<Charger>('/chargers', { method: 'POST', body: JSON.stringify(body) });

export const updateCharger = (id: string, body: Partial<ChargerInput>) =>
  api<Charger>(`/chargers/${id}`, { method: 'PATCH', body: JSON.stringify(body) });

export const deleteCharger = (id: string) =>
  api<void>(`/chargers/${id}`, { method: 'DELETE' });
