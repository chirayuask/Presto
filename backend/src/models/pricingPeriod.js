export const definePricingPeriod = (sequelize, DataTypes) => {
  const PricingPeriod = sequelize.define(
    'PricingPeriod',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      scheduleId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'schedule_id',
        references: { model: 'pricing_schedules', key: 'id' },
        onDelete: 'CASCADE',
      },
      startTime: {
        type: DataTypes.TIME,
        allowNull: false,
        field: 'start_time',
      },
      endTime: {
        type: DataTypes.TIME,
        allowNull: false,
        field: 'end_time',
        comment: 'If end <= start, period wraps past midnight',
      },
      pricePerKwh: {
        type: DataTypes.DECIMAL(10, 4),
        allowNull: false,
        field: 'price_per_kwh',
      },
    },
    {
      tableName: 'pricing_periods',
      indexes: [
        { fields: ['schedule_id'] },
        { unique: true, fields: ['schedule_id', 'start_time'] },
      ],
    },
  );

  return PricingPeriod;
};
