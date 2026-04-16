export const definePricingSchedule = (sequelize, DataTypes) => {
  const PricingSchedule = sequelize.define(
    'PricingSchedule',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      chargerId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'charger_id',
        references: { model: 'chargers', key: 'id' },
        onDelete: 'CASCADE',
      },
      name: {
        type: DataTypes.STRING(200),
        allowNull: true,
      },
      currency: {
        type: DataTypes.STRING(3),
        allowNull: false,
        defaultValue: 'USD',
      },
      effectiveFrom: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        field: 'effective_from',
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        field: 'is_active',
      },
    },
    {
      tableName: 'pricing_schedules',
      indexes: [
        { fields: ['charger_id'] },
        { fields: ['charger_id', 'is_active'] },
        { fields: ['effective_from'] },
      ],
    },
  );

  return PricingSchedule;
};
