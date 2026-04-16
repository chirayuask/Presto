import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { sequelize, Station, Charger, PricingSchedule, PricingPeriod } from '../src/models/index.js';

const TEST_SCHEDULE = [
  { startTime: '00:00:00', endTime: '06:00:00', pricePerKwh: 0.15 },
  { startTime: '06:00:00', endTime: '12:00:00', pricePerKwh: 0.20 },
  { startTime: '12:00:00', endTime: '14:00:00', pricePerKwh: 0.25 },
  { startTime: '14:00:00', endTime: '18:00:00', pricePerKwh: 0.30 },
  { startTime: '18:00:00', endTime: '20:00:00', pricePerKwh: 0.25 },
  { startTime: '20:00:00', endTime: '22:00:00', pricePerKwh: 0.20 },
  { startTime: '22:00:00', endTime: '00:00:00', pricePerKwh: 0.15 },
];

let app;
let kolkataChargerId;
let laChargerId;

beforeAll(async () => {
  await sequelize.sync({ force: true });
  app = createApp();

  const kolkataStation = await Station.create({
    name: 'Test Mumbai',
    timezone: 'Asia/Kolkata',
  });
  const laStation = await Station.create({
    name: 'Test LA',
    timezone: 'America/Los_Angeles',
  });

  const kolkataCharger = await Charger.create({
    stationId: kolkataStation.id,
    serialNumber: 'TEST-KOL-01',
  });
  const laCharger = await Charger.create({
    stationId: laStation.id,
    serialNumber: 'TEST-LA-01',
  });

  kolkataChargerId = kolkataCharger.id;
  laChargerId = laCharger.id;

  for (const chargerId of [kolkataCharger.id, laCharger.id]) {
    const schedule = await PricingSchedule.create({
      chargerId,
      name: 'Default',
      currency: 'USD',
      effectiveFrom: '2026-01-01',
      isActive: true,
    });
    for (const p of TEST_SCHEDULE) {
      await PricingPeriod.create({ scheduleId: schedule.id, ...p });
    }
  }
});

afterAll(async () => {
  await sequelize.close();
});

describe('GET /api/v1/chargers/:id/pricing/current', () => {
  it('returns price for instant in station timezone (14:30 IST -> peak)', async () => {
    const res = await request(app)
      .get(`/api/v1/chargers/${kolkataChargerId}/pricing/current`)
      .query({ at: '2026-04-16T14:30:00+05:30' });

    expect(res.status).toBe(200);
    expect(res.body.data.timezone).toBe('Asia/Kolkata');
    expect(res.body.data.localTime).toBe('14:30');
    expect(res.body.data.period.pricePerKwh).toBeCloseTo(0.30, 4);
    expect(res.body.data.period.startTime).toBe('14:00');
    expect(res.body.data.period.endTime).toBe('18:00');
  });

  it('picks midnight-wrap period at 23:30 local', async () => {
    const res = await request(app)
      .get(`/api/v1/chargers/${kolkataChargerId}/pricing/current`)
      .query({ at: '2026-04-16T23:30:00+05:30' });

    expect(res.status).toBe(200);
    expect(res.body.data.period.startTime).toBe('22:00');
    expect(res.body.data.period.endTime).toBe('00:00');
    expect(res.body.data.period.pricePerKwh).toBeCloseTo(0.15, 4);
  });

  it('interprets same UTC instant differently in different timezones', async () => {
    const utcInstant = '2026-04-16T10:00:00Z';
    const kolkataRes = await request(app)
      .get(`/api/v1/chargers/${kolkataChargerId}/pricing/current`)
      .query({ at: utcInstant });
    const laRes = await request(app)
      .get(`/api/v1/chargers/${laChargerId}/pricing/current`)
      .query({ at: utcInstant });

    expect(kolkataRes.body.data.localTime).toBe('15:30');
    expect(kolkataRes.body.data.period.pricePerKwh).toBeCloseTo(0.30, 4);

    expect(laRes.body.data.localTime).toBe('03:00');
    expect(laRes.body.data.period.pricePerKwh).toBeCloseTo(0.15, 4);
  });

  it('returns 404 for unknown charger', async () => {
    const res = await request(app).get(
      '/api/v1/chargers/00000000-0000-0000-0000-000000000000/pricing/current',
    );
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('CHARGER_NOT_FOUND');
  });

  it('returns 400 for invalid UUID', async () => {
    const res = await request(app).get('/api/v1/chargers/nope/pricing/current');
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns 400 for invalid at timestamp', async () => {
    const res = await request(app)
      .get(`/api/v1/chargers/${kolkataChargerId}/pricing/current`)
      .query({ at: 'not-a-date' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});

describe('GET /api/v1/chargers/:id/pricing/schedule', () => {
  it('returns all 7 periods covering 1440 minutes', async () => {
    const res = await request(app)
      .get(`/api/v1/chargers/${kolkataChargerId}/pricing/schedule`)
      .query({ date: '2026-04-16' });

    expect(res.status).toBe(200);
    expect(res.body.data.periods).toHaveLength(7);
    expect(res.body.data.totalCoverageMinutes).toBe(1440);
    expect(res.body.data.periods[0].startTime).toBe('00:00');
    expect(res.body.data.periods[6].startTime).toBe('22:00');
  });

  it('defaults to today when no date provided', async () => {
    const res = await request(app).get(`/api/v1/chargers/${kolkataChargerId}/pricing/schedule`);
    expect(res.status).toBe(200);
    expect(res.body.data.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('returns 400 for malformed date', async () => {
    const res = await request(app)
      .get(`/api/v1/chargers/${kolkataChargerId}/pricing/schedule`)
      .query({ date: '16-04-2026' });
    expect(res.status).toBe(400);
  });
});
