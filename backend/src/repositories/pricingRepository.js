import { Op } from 'sequelize';
import { Charger, Station, PricingSchedule, PricingPeriod } from '../models/index.js';

export const findChargerWithStation = (chargerId) =>
  Charger.findByPk(chargerId, {
    include: [{ model: Station, as: 'station' }],
  });

export const findActiveScheduleForDate = (chargerId, dateStr) =>
  PricingSchedule.findOne({
    where: {
      chargerId,
      isActive: true,
      effectiveFrom: { [Op.lte]: dateStr },
    },
    order: [['effective_from', 'DESC']],
    include: [{ model: PricingPeriod, as: 'periods' }],
  });
