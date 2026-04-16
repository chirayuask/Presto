import { DateTime, IANAZone } from 'luxon';

export const isValidIanaZone = (zone) => IANAZone.isValidZone(zone);

export const timeStringToMinutes = (timeStr) => {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
};

export const minutesToTimeString = (minutes) => {
  const h = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

export const normalizeTimeColumn = (value) => {
  if (!value) return null;
  if (value instanceof Date) {
    return `${String(value.getUTCHours()).padStart(2, '0')}:${String(value.getUTCMinutes()).padStart(2, '0')}`;
  }
  return value.slice(0, 5);
};

export const periodContainsMinute = (period, minuteOfDay) => {
  const start = timeStringToMinutes(normalizeTimeColumn(period.startTime ?? period.start_time));
  const endRaw = normalizeTimeColumn(period.endTime ?? period.end_time);
  const end = timeStringToMinutes(endRaw);
  const endInclusive = end === 0 ? 1440 : end;

  if (endInclusive > start) {
    return minuteOfDay >= start && minuteOfDay < endInclusive;
  }
  return minuteOfDay >= start || minuteOfDay < endInclusive;
};

export const resolveInstantInZone = (isoOrNull, zone) => {
  const now = isoOrNull
    ? DateTime.fromISO(isoOrNull, { setZone: true })
    : DateTime.now();
  if (!now.isValid) {
    throw new Error(`Invalid ISO timestamp: ${isoOrNull}`);
  }
  const local = now.setZone(zone);
  return {
    local,
    minuteOfDay: local.hour * 60 + local.minute,
    dateInZone: local.toISODate(),
  };
};

export const resolveDateInZone = (dateStr, zone) => {
  const dt = DateTime.fromISO(dateStr, { zone });
  if (!dt.isValid) {
    throw new Error(`Invalid date: ${dateStr}`);
  }
  return dt.toISODate();
};

export const sortPeriodsByStart = (periods) =>
  [...periods].sort((a, b) => {
    const aStart = timeStringToMinutes(normalizeTimeColumn(a.startTime ?? a.start_time));
    const bStart = timeStringToMinutes(normalizeTimeColumn(b.startTime ?? b.start_time));
    return aStart - bStart;
  });
