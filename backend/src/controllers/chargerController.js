import * as service from '../services/chargerService.js';

export const list = async (req, res, next) => {
  try {
    const data = await service.listChargers(req.validatedQuery ?? {});
    res.json({ data });
  } catch (err) { next(err); }
};

export const get = async (req, res, next) => {
  try {
    const data = await service.getCharger(req.params.id);
    res.json({ data });
  } catch (err) { next(err); }
};

export const create = async (req, res, next) => {
  try {
    const data = await service.createCharger(req.body);
    res.status(201).json({ data });
  } catch (err) { next(err); }
};

export const update = async (req, res, next) => {
  try {
    const data = await service.updateCharger(req.params.id, req.body);
    res.json({ data });
  } catch (err) { next(err); }
};

export const remove = async (req, res, next) => {
  try {
    await service.deleteCharger(req.params.id);
    res.status(204).end();
  } catch (err) { next(err); }
};
