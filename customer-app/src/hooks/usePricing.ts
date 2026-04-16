import { useQuery } from '@tanstack/react-query';
import { getCurrentPrice, getDailySchedule, listChargers } from '@/api/pricing';

export const useChargers = () =>
  useQuery({ queryKey: ['chargers'], queryFn: listChargers });

export const useCurrentPrice = (chargerId: string | undefined, at?: string) =>
  useQuery({
    queryKey: ['current-price', chargerId, at],
    queryFn: () => getCurrentPrice(chargerId!, at),
    enabled: !!chargerId,
    refetchInterval: at ? false : 60_000,
  });

export const useDailySchedule = (chargerId: string | undefined, date?: string) =>
  useQuery({
    queryKey: ['daily-schedule', chargerId, date],
    queryFn: () => getDailySchedule(chargerId!, date),
    enabled: !!chargerId,
  });
