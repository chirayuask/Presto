import { useMutation, useQueryClient } from '@tanstack/react-query';
import { bulkApplyByChargers, bulkApplyByStations } from '@/api/bulk';

export const useBulkByChargers = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: bulkApplyByChargers,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['schedules'] });
      qc.invalidateQueries({ queryKey: ['current-price'] });
      qc.invalidateQueries({ queryKey: ['daily-schedule'] });
    },
  });
};

export const useBulkByStations = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: bulkApplyByStations,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['schedules'] });
      qc.invalidateQueries({ queryKey: ['current-price'] });
      qc.invalidateQueries({ queryKey: ['daily-schedule'] });
    },
  });
};
