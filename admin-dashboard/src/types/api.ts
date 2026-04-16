export type UUID = string;

export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
}

export interface Station {
  id: UUID;
  name: string;
  address?: string | null;
  timezone: string;
  chargerCount?: number;
  chargers?: Charger[];
  createdAt: string;
  updatedAt: string;
}

export interface Charger {
  id: UUID;
  stationId: UUID;
  station?: { id: UUID; name: string; timezone: string };
  serialNumber: string;
  label?: string | null;
  connectorType?: string | null;
  powerKw?: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface PricingPeriod {
  id?: UUID;
  startTime: string;
  endTime: string;
  pricePerKwh: number;
  currency?: string;
}

export interface PricingSchedule {
  id: UUID;
  chargerId: UUID;
  name?: string | null;
  currency: string;
  effectiveFrom: string;
  isActive: boolean;
  periods?: PricingPeriod[];
  createdAt: string;
  updatedAt: string;
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
  schedule: {
    id: UUID;
    name?: string | null;
    currency: string;
    effectiveFrom: string;
  };
  periods: PricingPeriod[];
  totalCoverageMinutes: number;
}

export interface BulkReport {
  total: number;
  succeededCount: number;
  failedCount: number;
  succeeded: { chargerId: UUID; scheduleId: UUID; stationId?: UUID }[];
  failed: { chargerId: UUID; stationId?: UUID; error: ApiError }[];
}

export interface TimezoneOption {
  zone: string;
  offset: string;
}
