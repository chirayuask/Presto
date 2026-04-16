import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { sequelize } from '../src/models/index.js';

let app;

beforeAll(async () => {
  await sequelize.sync({ force: true });
  app = createApp();
});

afterAll(async () => {
  await sequelize.close();
});

describe('stations CRUD', () => {
  it('creates, gets, lists, updates, and deletes a station', async () => {
    const create = await request(app)
      .post('/api/v1/stations')
      .send({ name: 'Alpha Station', timezone: 'Asia/Kolkata', address: '1 Alpha St' });
    expect(create.status).toBe(201);
    const id = create.body.data.id;

    const get = await request(app).get(`/api/v1/stations/${id}`);
    expect(get.status).toBe(200);
    expect(get.body.data.name).toBe('Alpha Station');

    const list = await request(app).get('/api/v1/stations');
    expect(list.status).toBe(200);
    expect(list.body.data.length).toBeGreaterThanOrEqual(1);

    const update = await request(app)
      .patch(`/api/v1/stations/${id}`)
      .send({ address: 'Updated Address' });
    expect(update.status).toBe(200);
    expect(update.body.data.address).toBe('Updated Address');

    const del = await request(app).delete(`/api/v1/stations/${id}`);
    expect(del.status).toBe(204);

    const gone = await request(app).get(`/api/v1/stations/${id}`);
    expect(gone.status).toBe(404);
  });

  it('rejects invalid IANA timezone', async () => {
    const res = await request(app)
      .post('/api/v1/stations')
      .send({ name: 'Bad', timezone: 'Mars/Olympus' });
    expect(res.status).toBe(400);
  });
});

describe('chargers CRUD', () => {
  let stationId;

  beforeAll(async () => {
    const res = await request(app)
      .post('/api/v1/stations')
      .send({ name: 'Charger Host', timezone: 'Europe/London' });
    stationId = res.body.data.id;
  });

  it('creates and manages a charger', async () => {
    const create = await request(app)
      .post('/api/v1/chargers')
      .send({ stationId, serialNumber: 'LDN-01', label: 'Bay 1', powerKw: 120 });
    expect(create.status).toBe(201);
    expect(create.body.data.station.timezone).toBe('Europe/London');

    const id = create.body.data.id;
    const list = await request(app).get(`/api/v1/chargers?stationId=${stationId}`);
    expect(list.status).toBe(200);
    expect(list.body.data.length).toBe(1);

    const update = await request(app)
      .patch(`/api/v1/chargers/${id}`)
      .send({ label: 'Bay 1 Updated' });
    expect(update.status).toBe(200);
    expect(update.body.data.label).toBe('Bay 1 Updated');

    const del = await request(app).delete(`/api/v1/chargers/${id}`);
    expect(del.status).toBe(204);
  });

  it('rejects charger with unknown station', async () => {
    const res = await request(app)
      .post('/api/v1/chargers')
      .send({
        stationId: '00000000-0000-0000-0000-000000000000',
        serialNumber: 'X-1',
      });
    expect(res.status).toBe(404);
  });
});

describe('schedules CRUD + period validation', () => {
  let chargerId;

  beforeAll(async () => {
    const st = await request(app)
      .post('/api/v1/stations')
      .send({ name: 'Sched Host', timezone: 'UTC' });
    const ch = await request(app)
      .post('/api/v1/chargers')
      .send({ stationId: st.body.data.id, serialNumber: 'SCH-01' });
    chargerId = ch.body.data.id;
  });

  const validPeriods = [
    { startTime: '00:00', endTime: '08:00', pricePerKwh: 0.10 },
    { startTime: '08:00', endTime: '20:00', pricePerKwh: 0.30 },
    { startTime: '20:00', endTime: '00:00', pricePerKwh: 0.15 },
  ];

  it('creates a schedule with valid periods', async () => {
    const res = await request(app)
      .post(`/api/v1/chargers/${chargerId}/schedules`)
      .send({ effectiveFrom: '2026-01-01', currency: 'USD', periods: validPeriods });
    expect(res.status).toBe(201);
    expect(res.body.data.periods).toHaveLength(3);
    expect(res.body.data.isActive).toBe(true);
  });

  it('deactivates previous active schedule when creating new active one', async () => {
    const first = await request(app).get(`/api/v1/chargers/${chargerId}/schedules`);
    const activeBefore = first.body.data.filter((s) => s.isActive);
    expect(activeBefore.length).toBe(1);

    await request(app)
      .post(`/api/v1/chargers/${chargerId}/schedules`)
      .send({ effectiveFrom: '2026-06-01', currency: 'USD', periods: validPeriods });

    const after = await request(app).get(`/api/v1/chargers/${chargerId}/schedules`);
    expect(after.body.data.filter((s) => s.isActive).length).toBe(1);
    expect(after.body.data.length).toBe(2);
  });

  it('rejects periods with a gap', async () => {
    const res = await request(app)
      .post(`/api/v1/chargers/${chargerId}/schedules`)
      .send({
        effectiveFrom: '2026-01-01',
        periods: [
          { startTime: '00:00', endTime: '06:00', pricePerKwh: 0.1 },
          { startTime: '08:00', endTime: '00:00', pricePerKwh: 0.2 },
        ],
      });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_PERIODS');
    expect(res.body.error.message).toMatch(/Gap/i);
  });

  it('rejects periods with overlap', async () => {
    const res = await request(app)
      .post(`/api/v1/chargers/${chargerId}/schedules`)
      .send({
        effectiveFrom: '2026-01-01',
        periods: [
          { startTime: '00:00', endTime: '10:00', pricePerKwh: 0.1 },
          { startTime: '09:00', endTime: '00:00', pricePerKwh: 0.2 },
        ],
      });
    expect(res.status).toBe(400);
    expect(res.body.error.message).toMatch(/overlap/i);
  });

  it('rejects periods that don\'t cover full day', async () => {
    const res = await request(app)
      .post(`/api/v1/chargers/${chargerId}/schedules`)
      .send({
        effectiveFrom: '2026-01-01',
        periods: [{ startTime: '06:00', endTime: '18:00', pricePerKwh: 0.2 }],
      });
    expect(res.status).toBe(400);
  });

  it('replaces periods via PUT', async () => {
    const create = await request(app)
      .post(`/api/v1/chargers/${chargerId}/schedules`)
      .send({ effectiveFrom: '2026-07-01', periods: validPeriods });
    const scheduleId = create.body.data.id;

    const newPeriods = [
      { startTime: '00:00', endTime: '12:00', pricePerKwh: 0.40 },
      { startTime: '12:00', endTime: '00:00', pricePerKwh: 0.20 },
    ];
    const replace = await request(app)
      .put(`/api/v1/schedules/${scheduleId}/periods`)
      .send({ periods: newPeriods });
    expect(replace.status).toBe(200);
    expect(replace.body.data.periods).toHaveLength(2);
  });

  it('clones a schedule to another charger', async () => {
    const otherCh = await request(app)
      .post('/api/v1/chargers')
      .send({ stationId: (await request(app).get('/api/v1/stations')).body.data[0].id, serialNumber: 'CLONE-TARGET-01' });
    const targetChargerId = otherCh.body.data.id;

    const source = await request(app)
      .post(`/api/v1/chargers/${chargerId}/schedules`)
      .send({ effectiveFrom: '2026-08-01', periods: validPeriods, name: 'Summer' });

    const clone = await request(app)
      .post(`/api/v1/schedules/${source.body.data.id}/clone`)
      .send({ targetChargerId, isActive: true });
    expect(clone.status).toBe(201);
    expect(clone.body.data.chargerId).toBe(targetChargerId);
    expect(clone.body.data.periods).toHaveLength(3);
    expect(clone.body.data.isActive).toBe(true);
  });
});

describe('timezones helper', () => {
  it('lists popular IANA zones with offsets', async () => {
    const res = await request(app).get('/api/v1/timezones');
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(5);
    expect(res.body.data[0]).toHaveProperty('zone');
    expect(res.body.data[0]).toHaveProperty('offset');
  });
});
