import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { sequelize, Station, Charger, PricingSchedule } from '../src/models/index.js';

let app;
let stationA;
let stationB;
let chargersA;
let chargersB;

const VALID_PERIODS = [
  { startTime: '00:00', endTime: '08:00', pricePerKwh: 0.10 },
  { startTime: '08:00', endTime: '20:00', pricePerKwh: 0.35 },
  { startTime: '20:00', endTime: '00:00', pricePerKwh: 0.15 },
];

beforeAll(async () => {
  await sequelize.sync({ force: true });
  app = createApp();

  stationA = await Station.create({ name: 'Station A', timezone: 'Asia/Kolkata' });
  stationB = await Station.create({ name: 'Station B', timezone: 'America/Los_Angeles' });

  chargersA = await Charger.bulkCreate([
    { stationId: stationA.id, serialNumber: 'A-01' },
    { stationId: stationA.id, serialNumber: 'A-02' },
    { stationId: stationA.id, serialNumber: 'A-03' },
  ]);
  chargersB = await Charger.bulkCreate([
    { stationId: stationB.id, serialNumber: 'B-01' },
    { stationId: stationB.id, serialNumber: 'B-02' },
  ]);
});

afterAll(async () => {
  await sequelize.close();
});

describe('POST /pricing/bulk', () => {
  it('applies schedule to all valid chargers and returns 200', async () => {
    const res = await request(app)
      .post('/api/v1/pricing/bulk')
      .send({
        chargerIds: chargersA.map((c) => c.id),
        schedule: {
          name: 'Bulk Test A',
          currency: 'INR',
          effectiveFrom: '2026-01-01',
          periods: VALID_PERIODS,
        },
      });

    expect(res.status).toBe(200);
    expect(res.body.data.total).toBe(3);
    expect(res.body.data.succeededCount).toBe(3);
    expect(res.body.data.failedCount).toBe(0);
    expect(res.body.data.succeeded).toHaveLength(3);

    const schedules = await PricingSchedule.findAll({
      where: { chargerId: chargersA.map((c) => c.id) },
    });
    expect(schedules).toHaveLength(3);
  });

  it('returns 207 multi-status when some chargers fail', async () => {
    const res = await request(app)
      .post('/api/v1/pricing/bulk')
      .send({
        chargerIds: [
          chargersB[0].id,
          '00000000-0000-0000-0000-000000000000',
          chargersB[1].id,
        ],
        schedule: {
          effectiveFrom: '2026-01-01',
          currency: 'USD',
          periods: VALID_PERIODS,
        },
      });

    expect(res.status).toBe(207);
    expect(res.body.data.total).toBe(3);
    expect(res.body.data.succeededCount).toBe(2);
    expect(res.body.data.failedCount).toBe(1);
    expect(res.body.data.failed[0].error.code).toBe('CHARGER_NOT_FOUND');
  });

  it('returns 422 when all chargers fail', async () => {
    const res = await request(app)
      .post('/api/v1/pricing/bulk')
      .send({
        chargerIds: [
          '00000000-0000-0000-0000-000000000000',
          '00000000-0000-0000-0000-000000000001',
        ],
        schedule: {
          effectiveFrom: '2026-01-01',
          periods: VALID_PERIODS,
        },
      });

    expect(res.status).toBe(422);
    expect(res.body.data.succeededCount).toBe(0);
  });

  it('rejects invalid periods before touching the DB (400)', async () => {
    const res = await request(app)
      .post('/api/v1/pricing/bulk')
      .send({
        chargerIds: [chargersA[0].id],
        schedule: {
          effectiveFrom: '2026-01-01',
          periods: [
            { startTime: '00:00', endTime: '06:00', pricePerKwh: 0.1 },
            { startTime: '08:00', endTime: '00:00', pricePerKwh: 0.2 },
          ],
        },
      });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_PERIODS');
  });

  it('deduplicates chargerIds', async () => {
    const res = await request(app)
      .post('/api/v1/pricing/bulk')
      .send({
        chargerIds: [chargersA[0].id, chargersA[0].id, chargersA[0].id],
        schedule: {
          effectiveFrom: '2026-02-01',
          periods: VALID_PERIODS,
        },
      });
    expect(res.status).toBe(200);
    expect(res.body.data.total).toBe(1);
  });
});

describe('POST /pricing/bulk/by-station', () => {
  it('applies to all chargers in listed stations', async () => {
    const res = await request(app)
      .post('/api/v1/pricing/bulk/by-station')
      .send({
        stationIds: [stationA.id, stationB.id],
        schedule: {
          name: 'Station-wide',
          effectiveFrom: '2026-03-01',
          currency: 'USD',
          periods: VALID_PERIODS,
        },
      });

    expect(res.status).toBe(200);
    expect(res.body.data.total).toBe(5);
    expect(res.body.data.succeededCount).toBe(5);
    expect(res.body.data.succeeded[0].stationId).toBeDefined();
  });

  it('returns zero-result when station has no chargers', async () => {
    const emptyStation = await Station.create({ name: 'Empty', timezone: 'UTC' });
    const res = await request(app)
      .post('/api/v1/pricing/bulk/by-station')
      .send({
        stationIds: [emptyStation.id],
        schedule: { effectiveFrom: '2026-01-01', periods: VALID_PERIODS },
      });
    expect(res.status).toBe(200);
    expect(res.body.data.total).toBe(0);
  });
});
