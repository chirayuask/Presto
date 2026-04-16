import 'dotenv/config';
import { createApp } from './app.js';
import { sequelize } from './models/index.js';
import { logger } from './utils/logger.js';

const PORT = Number(process.env.PORT || 4000);

const start = async () => {
  try {
    await sequelize.authenticate();
    logger.info('Database connection established');
  } catch (err) {
    logger.error({ err }, 'Failed to connect to database');
    process.exit(1);
  }

  const app = createApp();
  app.listen(PORT, () => {
    logger.info(`Presto TOU API listening on http://localhost:${PORT}`);
  });
};

start();
