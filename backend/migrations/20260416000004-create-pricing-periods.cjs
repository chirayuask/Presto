'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('pricing_periods', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal('gen_random_uuid()'),
        primaryKey: true,
      },
      schedule_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'pricing_schedules', key: 'id' },
        onDelete: 'CASCADE',
      },
      start_time: { type: Sequelize.TIME, allowNull: false },
      end_time: { type: Sequelize.TIME, allowNull: false },
      price_per_kwh: { type: Sequelize.DECIMAL(10, 4), allowNull: false },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });

    await queryInterface.addIndex('pricing_periods', ['schedule_id']);
    await queryInterface.addIndex('pricing_periods', {
      fields: ['schedule_id', 'start_time'],
      unique: true,
      name: 'pricing_periods_schedule_start_unique',
    });

    await queryInterface.sequelize.query(`
      ALTER TABLE pricing_periods
      ADD CONSTRAINT pricing_periods_price_non_negative CHECK (price_per_kwh >= 0)
    `);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('pricing_periods');
  },
};
