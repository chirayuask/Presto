require('dotenv/config');

const base = {
  username: process.env.DB_USER || 'presto',
  password: process.env.DB_PASSWORD || 'presto',
  database: process.env.DB_NAME || 'presto_tou',
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 5432),
  dialect: process.env.DB_DIALECT || 'postgres',
  logging: false,
  define: {
    underscored: true,
    timestamps: true,
  },
};

module.exports = {
  development: base,
  test: { ...base, database: `${base.database}_test` },
  production: base,
};
