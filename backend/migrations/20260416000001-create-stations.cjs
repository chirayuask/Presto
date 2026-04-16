'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('stations', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal('gen_random_uuid()'),
        primaryKey: true,
      },
      name: { type: Sequelize.STRING(200), allowNull: false },
      address: { type: Sequelize.STRING(500), allowNull: true },
      timezone: { type: Sequelize.STRING(64), allowNull: false },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });

    await queryInterface.addIndex('stations', ['timezone']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('stations');
  },
};
