import { Sequelize, DataTypes } from 'sequelize';
import dbConfig from '../config/database.js';
import { defineStation } from './station.js';
import { defineCharger } from './charger.js';
import { definePricingSchedule } from './pricingSchedule.js';
import { definePricingPeriod } from './pricingPeriod.js';

const env = process.env.NODE_ENV || 'development';
const config = dbConfig[env];

export const sequelize = new Sequelize(
  config.database,
  config.username,
  config.password,
  config,
);

export const Station = defineStation(sequelize, DataTypes);
export const Charger = defineCharger(sequelize, DataTypes);
export const PricingSchedule = definePricingSchedule(sequelize, DataTypes);
export const PricingPeriod = definePricingPeriod(sequelize, DataTypes);

Station.hasMany(Charger, { foreignKey: 'stationId', as: 'chargers', onDelete: 'CASCADE' });
Charger.belongsTo(Station, { foreignKey: 'stationId', as: 'station' });

Charger.hasMany(PricingSchedule, { foreignKey: 'chargerId', as: 'schedules', onDelete: 'CASCADE' });
PricingSchedule.belongsTo(Charger, { foreignKey: 'chargerId', as: 'charger' });

PricingSchedule.hasMany(PricingPeriod, { foreignKey: 'scheduleId', as: 'periods', onDelete: 'CASCADE' });
PricingPeriod.belongsTo(PricingSchedule, { foreignKey: 'scheduleId', as: 'schedule' });

export const db = { sequelize, Sequelize, Station, Charger, PricingSchedule, PricingPeriod };
export default db;
