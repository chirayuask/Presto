import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createStation,
  deleteStation,
  getStation,
  listStations,
  updateStation,
  type StationInput,
} from '@/api/stations';

export const useStations = (params?: { timezone?: string; search?: string }) =>
  useQuery({
    queryKey: ['stations', params],
    queryFn: () => listStations(params),
  });

export const useStation = (id: string | undefined) =>
  useQuery({
    queryKey: ['station', id],
    queryFn: () => getStation(id!),
    enabled: !!id,
  });

export const useCreateStation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: StationInput) => createStation(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['stations'] }),
  });
};

export const useUpdateStation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: Partial<StationInput> }) =>
      updateStation(id, body),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ['stations'] });
      qc.invalidateQueries({ queryKey: ['station', id] });
    },
  });
};

export const useDeleteStation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteStation(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['stations'] });
      qc.invalidateQueries({ queryKey: ['chargers'] });
    },
  });
};
