import * as service from '../services/bulkService.js';

const pickStatus = (report) => {
  if (report.failedCount === 0) return 200;
  if (report.succeededCount === 0) return 422;
  return 207;
};

export const applyByChargers = async (req, res, next) => {
  try {
    const report = await service.bulkApplyByChargers(req.body);
    res.status(pickStatus(report)).json({ data: report });
  } catch (err) { next(err); }
};

export const applyByStations = async (req, res, next) => {
  try {
    const report = await service.bulkApplyByStations(req.body);
    res.status(pickStatus(report)).json({ data: report });
  } catch (err) { next(err); }
};
