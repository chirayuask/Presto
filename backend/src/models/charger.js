export const defineCharger = (sequelize, DataTypes) => {
  const Charger = sequelize.define(
    'Charger',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      stationId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'station_id',
        references: { model: 'stations', key: 'id' },
        onDelete: 'CASCADE',
      },
      serialNumber: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
        field: 'serial_number',
      },
      label: {
        type: DataTypes.STRING(200),
        allowNull: true,
      },
      connectorType: {
        type: DataTypes.STRING(50),
        allowNull: true,
        field: 'connector_type',
      },
      powerKw: {
        type: DataTypes.DECIMAL(6, 2),
        allowNull: true,
        field: 'power_kw',
      },
    },
    {
      tableName: 'chargers',
      indexes: [{ fields: ['station_id'] }],
    },
  );

  return Charger;
};
