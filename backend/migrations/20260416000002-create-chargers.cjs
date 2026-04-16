'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('chargers', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal('gen_random_uuid()'),
        primaryKey: true,
      },
      station_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'stations', key: 'id' },
        onDelete: 'CASCADE',
      },
      serial_number: { type: Sequelize.STRING(100), allowNull: false, unique: true },
      label: { type: Sequelize.STRING(200), allowNull: true },
      connector_type: { type: Sequelize.STRING(50), allowNull: true },
      power_kw: { type: Sequelize.DECIMAL(6, 2), allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });

    await queryInterface.addIndex('chargers', ['station_id']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('chargers');
  },
};
