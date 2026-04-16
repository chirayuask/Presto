'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('pricing_schedules', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal('gen_random_uuid()'),
        primaryKey: true,
      },
      charger_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'chargers', key: 'id' },
        onDelete: 'CASCADE',
      },
      name: { type: Sequelize.STRING(200), allowNull: true },
      currency: { type: Sequelize.STRING(3), allowNull: false, defaultValue: 'USD' },
      effective_from: { type: Sequelize.DATEONLY, allowNull: false },
      is_active: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });

    await queryInterface.addIndex('pricing_schedules', ['charger_id']);
    await queryInterface.addIndex('pricing_schedules', ['charger_id', 'is_active']);
    await queryInterface.addIndex('pricing_schedules', ['effective_from']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('pricing_schedules');
  },
};
