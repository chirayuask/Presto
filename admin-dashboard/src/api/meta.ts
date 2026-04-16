import { api } from './client';
import type { TimezoneOption } from '@/types/api';

export const listTimezones = () => api<TimezoneOption[]>('/timezones');

export const getHealth = () =>
  fetch('/api/v1/health')
    .then((r) => r.json())
    .then((j) => j as { status: string; checks: { database: string } });
