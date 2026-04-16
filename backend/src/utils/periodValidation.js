import { timeStringToMinutes } from './time.js';

export const validateAndNormalizePeriods = (periods) => {
  if (!periods.length) {
    throw new PeriodValidationError('At least one period required');
  }

  const intervals = periods.map((p) => {
    const start = timeStringToMinutes(p.startTime);
    const endRaw = timeStringToMinutes(p.endTime);
    const end = endRaw === 0 ? 1440 : endRaw;

    if (end === start) {
      throw new PeriodValidationError(`Period ${p.startTime}-${p.endTime} is empty`);
    }

    const wraps = end < start;
    return { ...p, startMin: start, endMin: end, wraps };
  });

  const wrappingCount = intervals.filter((i) => i.wraps).length;
  if (wrappingCount > 1) {
    throw new PeriodValidationError('Only one period may wrap past midnight');
  }

  const expanded = [];
  for (const iv of intervals) {
    if (iv.wraps) {
      expanded.push({ ...iv, startMin: iv.startMin, endMin: 1440 });
      expanded.push({ ...iv, startMin: 0, endMin: iv.endMin });
    } else {
      expanded.push(iv);
    }
  }

  expanded.sort((a, b) => a.startMin - b.startMin);

  for (let i = 0; i < expanded.length - 1; i += 1) {
    const cur = expanded[i];
    const next = expanded[i + 1];
    if (cur.endMin > next.startMin) {
      throw new PeriodValidationError(
        `Periods overlap: ${cur.startTime}-${cur.endTime} overlaps ${next.startTime}-${next.endTime}`,
      );
    }
    if (cur.endMin < next.startMin) {
      throw new PeriodValidationError(
        `Gap between periods: ${cur.startTime}-${cur.endTime} and ${next.startTime}-${next.endTime}`,
      );
    }
  }

  const first = expanded[0];
  const last = expanded[expanded.length - 1];
  if (first.startMin !== 0) {
    throw new PeriodValidationError('Periods must start at 00:00');
  }
  if (last.endMin !== 1440) {
    throw new PeriodValidationError('Periods must end at 24:00 (00:00 next day)');
  }

  return intervals.map((iv) => ({
    startTime: `${iv.startTime}:00`,
    endTime: iv.endTime === '00:00' ? '00:00:00' : `${iv.endTime}:00`,
    pricePerKwh: iv.pricePerKwh,
  }));
};

export class PeriodValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'PeriodValidationError';
  }
}
