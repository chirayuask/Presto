import { sequelize, Charger, PricingSchedule, PricingPeriod } from '../models/index.js';
import { AppError } from '../middleware/errorHandler.js';
import { PeriodValidationError, validateAndNormalizePeriods } from '../utils/periodValidation.js';
import { normalizeTimeColumn, sortPeriodsByStart } from '../utils/time.js';

const serializePeriod = (period) => ({
  id: period.id,
  startTime: normalizeTimeColumn(period.startTime),
  endTime: normalizeTimeColumn(period.endTime),
  pricePerKwh: Number(period.pricePerKwh),
});

const serializeSchedule = (schedule) => ({
  id: schedule.id,
  chargerId: schedule.chargerId,
  name: schedule.name,
  currency: schedule.currency,
  effectiveFrom: schedule.effectiveFrom,
  isActive: schedule.isActive,
  periods: schedule.periods ? sortPeriodsByStart(schedule.periods).map(serializePeriod) : undefined,
  createdAt: schedule.createdAt,
  updatedAt: schedule.updatedAt,
});

const ensureCharger = async (chargerId) => {
  const charger = await Charger.findByPk(chargerId);
  if (!charger) {
    throw new AppError(`Charger ${chargerId} not found`, {
      status: 404,
      code: 'CHARGER_NOT_FOUND',
    });
  }
  return charger;
};

const normalize = (periods) => {
  try {
    return validateAndNormalizePeriods(periods);
  } catch (err) {
    if (err instanceof PeriodValidationError) {
      throw new AppError(err.message, { status: 400, code: 'INVALID_PERIODS' });
    }
    throw err;
  }
};

export const listSchedulesForCharger = async (chargerId) => {
  await ensureCharger(chargerId);
  const schedules = await PricingSchedule.findAll({
    where: { chargerId },
    include: [{ model: PricingPeriod, as: 'periods' }],
    order: [['effective_from', 'DESC'], ['created_at', 'DESC']],
  });
  return schedules.map(serializeSchedule);
};

export const getSchedule = async (id) => {
  const schedule = await PricingSchedule.findByPk(id, {
    include: [{ model: PricingPeriod, as: 'periods' }],
  });
  if (!schedule) {
    throw new AppError(`Schedule ${id} not found`, { status: 404, code: 'SCHEDULE_NOT_FOUND' });
  }
  return serializeSchedule(schedule);
};

export const createSchedule = async (chargerId, payload) => {
  await ensureCharger(chargerId);
  const normalizedPeriods = normalize(payload.periods);

  const schedule = await sequelize.transaction(async (tx) => {
    if (payload.isActive !== false) {
      await PricingSchedule.update(
        { isActive: false },
        { where: { chargerId, isActive: true }, transaction: tx },
      );
    }

    const created = await PricingSchedule.create(
      {
        chargerId,
        name: payload.name ?? null,
        currency: payload.currency ?? 'USD',
        effectiveFrom: payload.effectiveFrom,
        isActive: payload.isActive !== false,
      },
      { transaction: tx },
    );

    await PricingPeriod.bulkCreate(
      normalizedPeriods.map((p) => ({ ...p, scheduleId: created.id })),
      { transaction: tx },
    );

    return created;
  });

  return getSchedule(schedule.id);
};

export const updateSchedule = async (id, payload) => {
  const schedule = await PricingSchedule.findByPk(id);
  if (!schedule) {
    throw new AppError(`Schedule ${id} not found`, { status: 404, code: 'SCHEDULE_NOT_FOUND' });
  }

  await sequelize.transaction(async (tx) => {
    if (payload.isActive === true && !schedule.isActive) {
      await PricingSchedule.update(
        { isActive: false },
        {
          where: { chargerId: schedule.chargerId, isActive: true },
          transaction: tx,
        },
      );
    }
    await schedule.update(payload, { transaction: tx });
  });

  return getSchedule(id);
};

export const replacePeriods = async (id, periods) => {
  const schedule = await PricingSchedule.findByPk(id);
  if (!schedule) {
    throw new AppError(`Schedule ${id} not found`, { status: 404, code: 'SCHEDULE_NOT_FOUND' });
  }
  const normalizedPeriods = normalize(periods);

  await sequelize.transaction(async (tx) => {
    await PricingPeriod.destroy({ where: { scheduleId: id }, transaction: tx });
    await PricingPeriod.bulkCreate(
      normalizedPeriods.map((p) => ({ ...p, scheduleId: id })),
      { transaction: tx },
    );
  });

  return getSchedule(id);
};

export const deleteSchedule = async (id) => {
  const count = await PricingSchedule.destroy({ where: { id } });
  if (!count) {
    throw new AppError(`Schedule ${id} not found`, { status: 404, code: 'SCHEDULE_NOT_FOUND' });
  }
};

export const cloneSchedule = async (id, payload = {}) => {
  const source = await PricingSchedule.findByPk(id, {
    include: [{ model: PricingPeriod, as: 'periods' }],
  });
  if (!source) {
    throw new AppError(`Schedule ${id} not found`, { status: 404, code: 'SCHEDULE_NOT_FOUND' });
  }

  const targetChargerId = payload.targetChargerId ?? source.chargerId;
  await ensureCharger(targetChargerId);

  const cloned = await sequelize.transaction(async (tx) => {
    if (payload.isActive === true) {
      await PricingSchedule.update(
        { isActive: false },
        { where: { chargerId: targetChargerId, isActive: true }, transaction: tx },
      );
    }

    const created = await PricingSchedule.create(
      {
        chargerId: targetChargerId,
        name: source.name ? `${source.name} (copy)` : 'Cloned Schedule',
        currency: source.currency,
        effectiveFrom: payload.effectiveFrom ?? source.effectiveFrom,
        isActive: payload.isActive === true,
      },
      { transaction: tx },
    );

    const periodsPayload = source.periods.map((p) => ({
      scheduleId: created.id,
      startTime: normalizeTimeColumn(p.startTime),
      endTime: normalizeTimeColumn(p.endTime),
      pricePerKwh: p.pricePerKwh,
    }));

    await PricingPeriod.bulkCreate(periodsPayload, { transaction: tx });
    return created;
  });

  return getSchedule(cloned.id);
};
