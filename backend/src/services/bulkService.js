import { sequelize, Charger, PricingSchedule, PricingPeriod } from '../models/index.js';
import { AppError } from '../middleware/errorHandler.js';
import { PeriodValidationError, validateAndNormalizePeriods } from '../utils/periodValidation.js';

const applyScheduleToCharger = async (chargerId, scheduleTemplate, activate, normalizedPeriods) => {
  return sequelize.transaction(async (tx) => {
    if (activate) {
      await PricingSchedule.update(
        { isActive: false },
        { where: { chargerId, isActive: true }, transaction: tx },
      );
    }

    const schedule = await PricingSchedule.create(
      {
        chargerId,
        name: scheduleTemplate.name ?? 'Bulk Schedule',
        currency: scheduleTemplate.currency ?? 'USD',
        effectiveFrom: scheduleTemplate.effectiveFrom,
        isActive: activate,
      },
      { transaction: tx },
    );

    await PricingPeriod.bulkCreate(
      normalizedPeriods.map((p) => ({ ...p, scheduleId: schedule.id })),
      { transaction: tx },
    );

    return schedule;
  });
};

export const bulkApplyByChargers = async ({ chargerIds, schedule, activateImmediately }) => {
  let normalizedPeriods;
  try {
    normalizedPeriods = validateAndNormalizePeriods(schedule.periods);
  } catch (err) {
    if (err instanceof PeriodValidationError) {
      throw new AppError(err.message, { status: 400, code: 'INVALID_PERIODS' });
    }
    throw err;
  }

  const uniqueIds = [...new Set(chargerIds)];
  const existing = await Charger.findAll({
    where: { id: uniqueIds },
    attributes: ['id'],
  });
  const existingSet = new Set(existing.map((c) => c.id));

  const succeeded = [];
  const failed = [];

  for (const chargerId of uniqueIds) {
    if (!existingSet.has(chargerId)) {
      failed.push({ chargerId, error: { code: 'CHARGER_NOT_FOUND', message: 'Charger does not exist' } });
      continue;
    }
    try {
      const created = await applyScheduleToCharger(
        chargerId,
        schedule,
        activateImmediately !== false,
        normalizedPeriods,
      );
      succeeded.push({ chargerId, scheduleId: created.id });
    } catch (err) {
      failed.push({
        chargerId,
        error: { code: err.code || 'APPLY_FAILED', message: err.message },
      });
    }
  }

  return {
    total: uniqueIds.length,
    succeededCount: succeeded.length,
    failedCount: failed.length,
    succeeded,
    failed,
  };
};

export const bulkApplyByStations = async ({ stationIds, schedule, activateImmediately }) => {
  const chargers = await Charger.findAll({
    where: { stationId: [...new Set(stationIds)] },
    attributes: ['id', 'stationId'],
  });

  if (!chargers.length) {
    return { total: 0, succeededCount: 0, failedCount: 0, succeeded: [], failed: [] };
  }

  const result = await bulkApplyByChargers({
    chargerIds: chargers.map((c) => c.id),
    schedule,
    activateImmediately,
  });

  const stationIndex = Object.fromEntries(chargers.map((c) => [c.id, c.stationId]));
  return {
    ...result,
    succeeded: result.succeeded.map((s) => ({ ...s, stationId: stationIndex[s.chargerId] })),
    failed: result.failed.map((f) => ({ ...f, stationId: stationIndex[f.chargerId] })),
  };
};
