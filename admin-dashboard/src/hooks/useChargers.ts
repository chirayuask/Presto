import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createCharger,
  deleteCharger,
  getCharger,
  listChargers,
  updateCharger,
  type ChargerInput,
} from '@/api/chargers';

export const useChargers = (params?: { stationId?: string; search?: string }) =>
  useQuery({
    queryKey: ['chargers', params],
    queryFn: () => listChargers(params),
  });

export const useCharger = (id: string | undefined) =>
  useQuery({
    queryKey: ['charger', id],
    queryFn: () => getCharger(id!),
    enabled: !!id,
  });

export const useCreateCharger = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: ChargerInput) => createCharger(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['chargers'] }),
  });
};

export const useUpdateCharger = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: Partial<ChargerInput> }) =>
      updateCharger(id, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['chargers'] }),
  });
};

export const useDeleteCharger = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteCharger(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['chargers'] }),
  });
};
