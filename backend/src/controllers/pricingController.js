import { getCurrentPrice, getDailySchedule } from '../services/pricingService.js';

export const getCurrentPriceHandler = async (req, res, next) => {
  try {
    const result = await getCurrentPrice({
      chargerId: req.params.chargerId,
      atIso: req.validatedQuery?.at,
    });
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
};

export const getDailyScheduleHandler = async (req, res, next) => {
  try {
    const result = await getDailySchedule({
      chargerId: req.params.chargerId,
      dateStr: req.validatedQuery?.date,
    });
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
};
