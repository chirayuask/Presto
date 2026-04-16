export const defineStation = (sequelize, DataTypes) => {
  const Station = sequelize.define(
    'Station',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING(200),
        allowNull: false,
      },
      address: {
        type: DataTypes.STRING(500),
        allowNull: true,
      },
      timezone: {
        type: DataTypes.STRING(64),
        allowNull: false,
        comment: 'IANA timezone identifier, e.g. Asia/Kolkata',
      },
    },
    {
      tableName: 'stations',
      indexes: [{ fields: ['timezone'] }],
    },
  );

  return Station;
};
