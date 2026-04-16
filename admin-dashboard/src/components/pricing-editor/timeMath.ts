export const toMinutes = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};

export const toHHMM = (minutes: number) => {
  const m = ((minutes % 1440) + 1440) % 1440;
  const h = Math.floor(m / 60);
  const mm = m % 60;
  return `${String(h).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
};

export const periodDurationMinutes = (start: string, end: string) => {
  const s = toMinutes(start);
  const e = toMinutes(end);
  const endAdj = e === 0 ? 1440 : e;
  return endAdj > s ? endAdj - s : 1440 - s + endAdj;
};

export interface EditablePeriod {
  id: string;
  startTime: string;
  endTime: string;
  pricePerKwh: number;
}

const uid = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);

export const toEditable = (
  periods: { startTime: string; endTime: string; pricePerKwh: number }[],
): EditablePeriod[] =>
  periods.map((p) => ({
    id: uid(),
    startTime: p.startTime,
    endTime: p.endTime,
    pricePerKwh: p.pricePerKwh,
  }));

export const sortByStart = (periods: EditablePeriod[]) =>
  [...periods].sort((a, b) => toMinutes(a.startTime) - toMinutes(b.startTime));

export interface ValidationReport {
  ok: boolean;
  errors: string[];
  coverageMinutes: number;
}

export const validatePeriods = (periods: EditablePeriod[]): ValidationReport => {
  const errors: string[] = [];
  if (!periods.length) return { ok: false, errors: ['Add at least one period'], coverageMinutes: 0 };

  let coverage = 0;
  const intervals = periods.map((p) => {
    const s = toMinutes(p.startTime);
    const eRaw = toMinutes(p.endTime);
    const e = eRaw === 0 ? 1440 : eRaw;
    return { ...p, s, e, wraps: e < s };
  });

  const wrapping = intervals.filter((i) => i.wraps).length;
  if (wrapping > 1) errors.push('Only one period may wrap past midnight');

  const expanded: { id: string; s: number; e: number; startTime: string; endTime: string }[] = [];
  for (const iv of intervals) {
    if (iv.s === iv.e) {
      errors.push(`Period ${iv.startTime}-${iv.endTime} is empty`);
      continue;
    }
    if (iv.wraps) {
      expanded.push({ id: iv.id, s: iv.s, e: 1440, startTime: iv.startTime, endTime: iv.endTime });
      expanded.push({ id: iv.id, s: 0, e: iv.e, startTime: iv.startTime, endTime: iv.endTime });
    } else {
      expanded.push({ id: iv.id, s: iv.s, e: iv.e, startTime: iv.startTime, endTime: iv.endTime });
    }
  }
  expanded.sort((a, b) => a.s - b.s);

  for (let i = 0; i < expanded.length - 1; i += 1) {
    const cur = expanded[i];
    const next = expanded[i + 1];
    if (cur.e > next.s) {
      errors.push(`Overlap: ${cur.startTime}-${cur.endTime} with ${next.startTime}-${next.endTime}`);
    } else if (cur.e < next.s) {
      errors.push(`Gap between ${cur.startTime}-${cur.endTime} and ${next.startTime}-${next.endTime}`);
    }
  }

  if (expanded.length) {
    if (expanded[0].s !== 0) errors.push('Periods must start at 00:00');
    if (expanded[expanded.length - 1].e !== 1440) errors.push('Periods must end at 24:00');
  }

  for (const iv of intervals) coverage += iv.e - iv.s + (iv.wraps ? 1440 : 0);

  return { ok: errors.length === 0, errors, coverageMinutes: coverage };
};

export const makeNewPeriod = (existing: EditablePeriod[]): EditablePeriod => {
  const sorted = sortByStart(existing);
  const gaps: { start: number; end: number }[] = [];
  let cursor = 0;
  for (const p of sorted) {
    const s = toMinutes(p.startTime);
    const eRaw = toMinutes(p.endTime);
    const e = eRaw === 0 ? 1440 : eRaw;
    if (s > cursor) gaps.push({ start: cursor, end: s });
    cursor = Math.max(cursor, e);
  }
  if (cursor < 1440) gaps.push({ start: cursor, end: 1440 });

  const pick = gaps.find((g) => g.end - g.start >= 60) ?? gaps[0] ?? { start: 0, end: 120 };
  return {
    id: uid(),
    startTime: toHHMM(pick.start),
    endTime: toHHMM(pick.end % 1440),
    pricePerKwh: 0.2,
  };
};

export const newUid = uid;
