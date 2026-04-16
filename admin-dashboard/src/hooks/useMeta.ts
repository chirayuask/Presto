import { useQuery } from '@tanstack/react-query';
import { getHealth, listTimezones } from '@/api/meta';

export const useTimezones = () =>
  useQuery({
    queryKey: ['timezones'],
    queryFn: listTimezones,
    staleTime: 5 * 60_000,
  });

export const useHealth = () =>
  useQuery({
    queryKey: ['health'],
    queryFn: getHealth,
    refetchInterval: 30_000,
  });
