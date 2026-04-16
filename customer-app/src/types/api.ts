export type UUID = string;

export interface PricingPeriod {
  id?: UUID;
  startTime: string;
  endTime: string;
  pricePerKwh: number;
  currency?: string;
}

export interface CurrentPrice {
  chargerId: UUID;
  stationId: UUID;
  stationName: string;
  timezone: string;
  queriedAt: string;
  localDate: string;
  localTime: string;
  scheduleId: UUID;
  period: PricingPeriod;
}

export interface DailySchedule {
  chargerId: UUID;
  stationId: UUID;
  stationName: string;
  timezone: string;
  date: string;
  schedule: { id: UUID; name?: string | null; currency: string; effectiveFrom: string };
  periods: PricingPeriod[];
  totalCoverageMinutes: number;
}

export interface Charger {
  id: UUID;
  serialNumber: string;
  label?: string | null;
  station?: { id: UUID; name: string; timezone: string };
}
