'use strict';

const { randomUUID } = require('node:crypto');

const STATIONS = [
  { name: 'Bandra Kurla EV Hub',       address: 'BKC, Mumbai, India',              timezone: 'Asia/Kolkata',         priceMultiplier: 1.0 },
  { name: 'Venice Beach Supercharge',  address: 'Venice, Los Angeles, CA, USA',    timezone: 'America/Los_Angeles',  priceMultiplier: 1.8 },
  { name: 'Kings Cross FastCharge',    address: 'Kings Cross, London, UK',         timezone: 'Europe/London',        priceMultiplier: 1.6 },
  { name: 'Darling Harbour ChargePoint', address: 'Darling Harbour, Sydney, AU',   timezone: 'Australia/Sydney',     priceMultiplier: 1.3 },
];

const BASE_PERIODS = [
  { start_time: '00:00:00', end_time: '06:00:00', price_per_kwh: 0.15 },
  { start_time: '06:00:00', end_time: '12:00:00', price_per_kwh: 0.20 },
  { start_time: '12:00:00', end_time: '14:00:00', price_per_kwh: 0.25 },
  { start_time: '14:00:00', end_time: '18:00:00', price_per_kwh: 0.30 },
  { start_time: '18:00:00', end_time: '20:00:00', price_per_kwh: 0.25 },
  { start_time: '20:00:00', end_time: '22:00:00', price_per_kwh: 0.20 },
  { start_time: '22:00:00', end_time: '00:00:00', price_per_kwh: 0.15 },
];

const CONNECTORS = ['CCS2', 'CHAdeMO', 'Type 2'];
const POWERS = [50, 120, 250];

module.exports = {
  async up(queryInterface) {
    const now = new Date();
    const effectiveFrom = '2026-01-01';

    const stationRows = [];
    const chargerRows = [];
    const scheduleRows = [];
    const periodRows = [];

    for (const stationDef of STATIONS) {
      const stationId = randomUUID();
      stationRows.push({
        id: stationId,
        name: stationDef.name,
        address: stationDef.address,
        timezone: stationDef.timezone,
        created_at: now,
        updated_at: now,
      });

      for (let i = 1; i <= 3; i += 1) {
        const chargerId = randomUUID();
        const serial = `${stationDef.timezone.split('/')[1].toUpperCase().slice(0, 3)}-${stationDef.name.split(' ')[0].toUpperCase().slice(0, 3)}-${String(i).padStart(2, '0')}`;
        const connector = CONNECTORS[(i - 1) % CONNECTORS.length];
        const power = POWERS[(i - 1) % POWERS.length];

        chargerRows.push({
          id: chargerId,
          station_id: stationId,
          serial_number: serial,
          label: `Charger ${i}`,
          connector_type: connector,
          power_kw: power,
          created_at: now,
          updated_at: now,
        });

        const scheduleId = randomUUID();
        scheduleRows.push({
          id: scheduleId,
          charger_id: chargerId,
          name: 'Default TOU Schedule',
          currency: stationDef.timezone === 'Europe/London' ? 'GBP'
            : stationDef.timezone === 'Australia/Sydney' ? 'AUD'
            : stationDef.timezone === 'Asia/Kolkata' ? 'INR'
            : 'USD',
          effective_from: effectiveFrom,
          is_active: true,
          created_at: now,
          updated_at: now,
        });

        const chargerPriceNoise = 1 + ((i - 2) * 0.05);

        for (const period of BASE_PERIODS) {
          const adjustedPrice = Number(
            (period.price_per_kwh * stationDef.priceMultiplier * chargerPriceNoise).toFixed(4),
          );
          periodRows.push({
            id: randomUUID(),
            schedule_id: scheduleId,
            start_time: period.start_time,
            end_time: period.end_time,
            price_per_kwh: adjustedPrice,
            created_at: now,
            updated_at: now,
          });
        }
      }
    }

    await queryInterface.bulkInsert('stations', stationRows);
    await queryInterface.bulkInsert('chargers', chargerRows);
    await queryInterface.bulkInsert('pricing_schedules', scheduleRows);
    await queryInterface.bulkInsert('pricing_periods', periodRows);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('pricing_periods', null, {});
    await queryInterface.bulkDelete('pricing_schedules', null, {});
    await queryInterface.bulkDelete('chargers', null, {});
    await queryInterface.bulkDelete('stations', null, {});
  },
};
