import { describe, it, expect } from '@jest/globals';
import {
  isValidIanaZone,
  timeStringToMinutes,
  minutesToTimeString,
  normalizeTimeColumn,
  periodContainsMinute,
  resolveInstantInZone,
  resolveDateInZone,
  sortPeriodsByStart,
} from '../src/utils/time.js';

describe('time utils', () => {
  describe('isValidIanaZone', () => {
    it('accepts IANA zones', () => {
      expect(isValidIanaZone('Asia/Kolkata')).toBe(true);
      expect(isValidIanaZone('America/Los_Angeles')).toBe(true);
    });
    it('rejects garbage', () => {
      expect(isValidIanaZone('Mars/Olympus')).toBe(false);
      expect(isValidIanaZone('')).toBe(false);
    });
  });

  describe('timeStringToMinutes / minutesToTimeString', () => {
    it('round-trips', () => {
      expect(timeStringToMinutes('00:00')).toBe(0);
      expect(timeStringToMinutes('14:30')).toBe(870);
      expect(timeStringToMinutes('23:59')).toBe(1439);
      expect(minutesToTimeString(0)).toBe('00:00');
      expect(minutesToTimeString(870)).toBe('14:30');
    });
  });

  describe('normalizeTimeColumn', () => {
    it('handles Date objects', () => {
      const d = new Date(Date.UTC(1970, 0, 1, 14, 30));
      expect(normalizeTimeColumn(d)).toBe('14:30');
    });
    it('handles HH:mm:ss strings', () => {
      expect(normalizeTimeColumn('14:30:00')).toBe('14:30');
    });
    it('handles null', () => {
      expect(normalizeTimeColumn(null)).toBe(null);
    });
  });

  describe('periodContainsMinute', () => {
    const noonToSix = { startTime: '12:00:00', endTime: '18:00:00' };
    const lateNight = { startTime: '22:00:00', endTime: '00:00:00' };

    it('includes start, excludes end (normal period)', () => {
      expect(periodContainsMinute(noonToSix, 12 * 60)).toBe(true);
      expect(periodContainsMinute(noonToSix, 17 * 60 + 59)).toBe(true);
      expect(periodContainsMinute(noonToSix, 18 * 60)).toBe(false);
      expect(periodContainsMinute(noonToSix, 11 * 60)).toBe(false);
    });

    it('handles midnight-wrap period (end <= start)', () => {
      expect(periodContainsMinute(lateNight, 22 * 60)).toBe(true);
      expect(periodContainsMinute(lateNight, 23 * 60 + 59)).toBe(true);
      expect(periodContainsMinute(lateNight, 0)).toBe(false);
      expect(periodContainsMinute(lateNight, 21 * 60 + 59)).toBe(false);
    });

    it('treats end=00:00 as end-of-day (1440)', () => {
      expect(periodContainsMinute(lateNight, 1439)).toBe(true);
    });
  });

  describe('resolveInstantInZone', () => {
    it('converts UTC instant to station local time', () => {
      const { minuteOfDay, dateInZone } = resolveInstantInZone(
        '2026-04-16T10:00:00Z',
        'Asia/Kolkata',
      );
      expect(minuteOfDay).toBe(15 * 60 + 30);
      expect(dateInZone).toBe('2026-04-16');
    });

    it('handles LA timezone correctly', () => {
      const { minuteOfDay, dateInZone } = resolveInstantInZone(
        '2026-04-16T10:00:00Z',
        'America/Los_Angeles',
      );
      expect(minuteOfDay).toBe(3 * 60);
      expect(dateInZone).toBe('2026-04-16');
    });

    it('throws on invalid iso', () => {
      expect(() => resolveInstantInZone('garbage', 'Asia/Kolkata')).toThrow();
    });
  });

  describe('resolveDateInZone', () => {
    it('accepts YYYY-MM-DD', () => {
      expect(resolveDateInZone('2026-04-16', 'Asia/Kolkata')).toBe('2026-04-16');
    });
    it('throws on invalid', () => {
      expect(() => resolveDateInZone('not-a-date', 'Asia/Kolkata')).toThrow();
    });
  });

  describe('sortPeriodsByStart', () => {
    it('orders by start_time ascending', () => {
      const shuffled = [
        { startTime: '18:00:00' },
        { startTime: '00:00:00' },
        { startTime: '12:00:00' },
      ];
      const sorted = sortPeriodsByStart(shuffled);
      expect(sorted.map((p) => p.startTime)).toEqual(['00:00:00', '12:00:00', '18:00:00']);
    });
  });
});
