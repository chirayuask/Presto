import { Op } from 'sequelize';
import { Station, Charger } from '../models/index.js';
import { AppError } from '../middleware/errorHandler.js';

const serialize = (station) => ({
  id: station.id,
  name: station.name,
  address: station.address,
  timezone: station.timezone,
  chargerCount: station.chargers ? station.chargers.length : undefined,
  createdAt: station.createdAt,
  updatedAt: station.updatedAt,
});

export const listStations = async ({ timezone, search }) => {
  const where = {};
  if (timezone) where.timezone = timezone;
  if (search) where.name = { [Op.iLike]: `%${search}%` };

  const stations = await Station.findAll({
    where,
    include: [{ model: Charger, as: 'chargers', attributes: ['id'] }],
    order: [['name', 'ASC']],
  });

  return stations.map(serialize);
};

export const getStation = async (id) => {
  const station = await Station.findByPk(id, {
    include: [{ model: Charger, as: 'chargers' }],
  });
  if (!station) {
    throw new AppError(`Station ${id} not found`, { status: 404, code: 'STATION_NOT_FOUND' });
  }
  return {
    ...serialize(station),
    chargers: station.chargers.map((c) => ({
      id: c.id,
      serialNumber: c.serialNumber,
      label: c.label,
      connectorType: c.connectorType,
      powerKw: c.powerKw ? Number(c.powerKw) : null,
    })),
  };
};

export const createStation = async (payload) => {
  const station = await Station.create(payload);
  return serialize(station);
};

export const updateStation = async (id, payload) => {
  const station = await Station.findByPk(id);
  if (!station) {
    throw new AppError(`Station ${id} not found`, { status: 404, code: 'STATION_NOT_FOUND' });
  }
  await station.update(payload);
  return serialize(station);
};

export const deleteStation = async (id) => {
  const count = await Station.destroy({ where: { id } });
  if (!count) {
    throw new AppError(`Station ${id} not found`, { status: 404, code: 'STATION_NOT_FOUND' });
  }
};
