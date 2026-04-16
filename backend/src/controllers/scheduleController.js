import * as service from '../services/scheduleService.js';

export const listForCharger = async (req, res, next) => {
  try {
    const data = await service.listSchedulesForCharger(req.params.chargerId);
    res.json({ data });
  } catch (err) { next(err); }
};

export const create = async (req, res, next) => {
  try {
    const data = await service.createSchedule(req.params.chargerId, req.body);
    res.status(201).json({ data });
  } catch (err) { next(err); }
};

export const get = async (req, res, next) => {
  try {
    const data = await service.getSchedule(req.params.id);
    res.json({ data });
  } catch (err) { next(err); }
};

export const update = async (req, res, next) => {
  try {
    const data = await service.updateSchedule(req.params.id, req.body);
    res.json({ data });
  } catch (err) { next(err); }
};

export const replacePeriods = async (req, res, next) => {
  try {
    const data = await service.replacePeriods(req.params.id, req.body.periods);
    res.json({ data });
  } catch (err) { next(err); }
};

export const remove = async (req, res, next) => {
  try {
    await service.deleteSchedule(req.params.id);
    res.status(204).end();
  } catch (err) { next(err); }
};

export const clone = async (req, res, next) => {
  try {
    const data = await service.cloneSchedule(req.params.id, req.body ?? {});
    res.status(201).json({ data });
  } catch (err) { next(err); }
};
