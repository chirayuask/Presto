import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  cloneSchedule,
  createSchedule,
  deleteSchedule,
  getCurrentPrice,
  getDailySchedule,
  getSchedule,
  listSchedulesForCharger,
  replaceSchedulePeriods,
  updateSchedule,
  type PeriodInput,
  type ScheduleInput,
} from '@/api/schedules';

export const useSchedulesForCharger = (chargerId: string | undefined) =>
  useQuery({
    queryKey: ['schedules', chargerId],
    queryFn: () => listSchedulesForCharger(chargerId!),
    enabled: !!chargerId,
  });

export const useSchedule = (id: string | undefined) =>
  useQuery({
    queryKey: ['schedule', id],
    queryFn: () => getSchedule(id!),
    enabled: !!id,
  });

export const useCurrentPrice = (chargerId: string | undefined, at?: string) =>
  useQuery({
    queryKey: ['current-price', chargerId, at],
    queryFn: () => getCurrentPrice(chargerId!, at),
    enabled: !!chargerId,
    refetchInterval: 60_000,
  });

export const useDailySchedule = (chargerId: string | undefined, date?: string) =>
  useQuery({
    queryKey: ['daily-schedule', chargerId, date],
    queryFn: () => getDailySchedule(chargerId!, date),
    enabled: !!chargerId,
  });

export const useCreateSchedule = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ chargerId, body }: { chargerId: string; body: ScheduleInput }) =>
      createSchedule(chargerId, body),
    onSuccess: (_, { chargerId }) => {
      qc.invalidateQueries({ queryKey: ['schedules', chargerId] });
      qc.invalidateQueries({ queryKey: ['current-price', chargerId] });
      qc.invalidateQueries({ queryKey: ['daily-schedule', chargerId] });
    },
  });
};

export const useUpdateSchedule = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      body,
    }: {
      id: string;
      body: Partial<Pick<ScheduleInput, 'name' | 'currency' | 'effectiveFrom' | 'isActive'>>;
    }) => updateSchedule(id, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['schedules'] });
      qc.invalidateQueries({ queryKey: ['schedule'] });
    },
  });
};

export const useReplacePeriods = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, periods }: { id: string; periods: PeriodInput[] }) =>
      replaceSchedulePeriods(id, periods),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['schedules'] });
      qc.invalidateQueries({ queryKey: ['schedule'] });
      qc.invalidateQueries({ queryKey: ['current-price'] });
      qc.invalidateQueries({ queryKey: ['daily-schedule'] });
    },
  });
};

export const useDeleteSchedule = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteSchedule(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['schedules'] });
      qc.invalidateQueries({ queryKey: ['current-price'] });
    },
  });
};

export const useCloneSchedule = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      body,
    }: {
      id: string;
      body: { targetChargerId?: string; effectiveFrom?: string; isActive?: boolean };
    }) => cloneSchedule(id, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['schedules'] }),
  });
};
