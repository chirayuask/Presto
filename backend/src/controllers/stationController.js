import * as service from '../services/stationService.js';

export const list = async (req, res, next) => {
  try {
    const data = await service.listStations(req.validatedQuery ?? {});
    res.json({ data });
  } catch (err) { next(err); }
};

export const get = async (req, res, next) => {
  try {
    const data = await service.getStation(req.params.id);
    res.json({ data });
  } catch (err) { next(err); }
};

export const create = async (req, res, next) => {
  try {
    const data = await service.createStation(req.body);
    res.status(201).json({ data });
  } catch (err) { next(err); }
};

export const update = async (req, res, next) => {
  try {
    const data = await service.updateStation(req.params.id, req.body);
    res.json({ data });
  } catch (err) { next(err); }
};

export const remove = async (req, res, next) => {
  try {
    await service.deleteStation(req.params.id);
    res.status(204).end();
  } catch (err) { next(err); }
};
