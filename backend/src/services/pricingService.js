import { AppError } from '../middleware/errorHandler.js';
import {
  findActiveScheduleForDate,
  findChargerWithStation,
} from '../repositories/pricingRepository.js';
import {
  normalizeTimeColumn,
  periodContainsMinute,
  resolveDateInZone,
  resolveInstantInZone,
  sortPeriodsByStart,
  timeStringToMinutes,
} from '../utils/time.js';

const loadContext = async (chargerId) => {
  const charger = await findChargerWithStation(chargerId);
  if (!charger) {
    throw new AppError(`Charger ${chargerId} not found`, { status: 404, code: 'CHARGER_NOT_FOUND' });
  }
  return { charger, station: charger.station };
};

const loadActiveSchedule = async (chargerId, dateStr) => {
  const schedule = await findActiveScheduleForDate(chargerId, dateStr);
  if (!schedule) {
    throw new AppError(
      `No active pricing schedule for charger ${chargerId} on ${dateStr}`,
      { status: 404, code: 'SCHEDULE_NOT_FOUND' },
    );
  }
  return schedule;
};

const serializePeriod = (period, currency) => ({
  id: period.id,
  startTime: normalizeTimeColumn(period.startTime),
  endTime: normalizeTimeColumn(period.endTime),
  pricePerKwh: Number(period.pricePerKwh),
  currency,
});

export const getCurrentPrice = async ({ chargerId, atIso }) => {
  const { charger, station } = await loadContext(chargerId);
  const { local, minuteOfDay, dateInZone } = resolveInstantInZone(atIso, station.timezone);
  const schedule = await loadActiveSchedule(chargerId, dateInZone);

  const match = schedule.periods.find((p) => periodContainsMinute(p, minuteOfDay));
  if (!match) {
    throw new AppError(
      'No pricing period covers the requested instant — schedule has gaps',
      { status: 409, code: 'SCHEDULE_GAP' },
    );
  }

  return {
    chargerId: charger.id,
    stationId: station.id,
    stationName: station.name,
    timezone: station.timezone,
    queriedAt: local.toISO(),
    localDate: dateInZone,
    localTime: local.toFormat('HH:mm'),
    scheduleId: schedule.id,
    period: serializePeriod(match, schedule.currency),
  };
};

export const getDailySchedule = async ({ chargerId, dateStr }) => {
  const { charger, station } = await loadContext(chargerId);
  const resolvedDate = dateStr
    ? resolveDateInZone(dateStr, station.timezone)
    : resolveInstantInZone(null, station.timezone).dateInZone;

  const schedule = await loadActiveSchedule(chargerId, resolvedDate);
  const sorted = sortPeriodsByStart(schedule.periods);

  return {
    chargerId: charger.id,
    stationId: station.id,
    stationName: station.name,
    timezone: station.timezone,
    date: resolvedDate,
    schedule: {
      id: schedule.id,
      name: schedule.name,
      currency: schedule.currency,
      effectiveFrom: schedule.effectiveFrom,
    },
    periods: sorted.map((p) => serializePeriod(p, schedule.currency)),
    totalCoverageMinutes: sorted.reduce((sum, p) => {
      const start = timeStringToMinutes(normalizeTimeColumn(p.startTime));
      const end = timeStringToMinutes(normalizeTimeColumn(p.endTime));
      const endAdj = end === 0 ? 1440 : end;
      return sum + (endAdj > start ? endAdj - start : 1440 - start + endAdj);
    }, 0),
  };
};
