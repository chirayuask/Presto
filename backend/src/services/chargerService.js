import { Op } from 'sequelize';
import { Charger, Station } from '../models/index.js';
import { AppError } from '../middleware/errorHandler.js';

const serialize = (charger) => ({
  id: charger.id,
  stationId: charger.stationId,
  station: charger.station
    ? { id: charger.station.id, name: charger.station.name, timezone: charger.station.timezone }
    : undefined,
  serialNumber: charger.serialNumber,
  label: charger.label,
  connectorType: charger.connectorType,
  powerKw: charger.powerKw ? Number(charger.powerKw) : null,
  createdAt: charger.createdAt,
  updatedAt: charger.updatedAt,
});

const ensureStation = async (stationId) => {
  const station = await Station.findByPk(stationId);
  if (!station) {
    throw new AppError(`Station ${stationId} not found`, {
      status: 404,
      code: 'STATION_NOT_FOUND',
    });
  }
};

export const listChargers = async ({ stationId, search }) => {
  const where = {};
  if (stationId) where.stationId = stationId;
  if (search) {
    where[Op.or] = [
      { serialNumber: { [Op.iLike]: `%${search}%` } },
      { label: { [Op.iLike]: `%${search}%` } },
    ];
  }

  const chargers = await Charger.findAll({
    where,
    include: [{ model: Station, as: 'station' }],
    order: [['serial_number', 'ASC']],
  });
  return chargers.map(serialize);
};

export const getCharger = async (id) => {
  const charger = await Charger.findByPk(id, {
    include: [{ model: Station, as: 'station' }],
  });
  if (!charger) {
    throw new AppError(`Charger ${id} not found`, { status: 404, code: 'CHARGER_NOT_FOUND' });
  }
  return serialize(charger);
};

export const createCharger = async (payload) => {
  await ensureStation(payload.stationId);
  const charger = await Charger.create(payload);
  return getCharger(charger.id);
};

export const updateCharger = async (id, payload) => {
  const charger = await Charger.findByPk(id);
  if (!charger) {
    throw new AppError(`Charger ${id} not found`, { status: 404, code: 'CHARGER_NOT_FOUND' });
  }
  if (payload.stationId) await ensureStation(payload.stationId);
  await charger.update(payload);
  return getCharger(id);
};

export const deleteCharger = async (id) => {
  const count = await Charger.destroy({ where: { id } });
  if (!count) {
    throw new AppError(`Charger ${id} not found`, { status: 404, code: 'CHARGER_NOT_FOUND' });
  }
};
