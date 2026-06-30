import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.changeColumn("AuditLogs", "metadata", {
      type: DataTypes.JSONB,
      allowNull: true
    });
  },

  down: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.changeColumn("AuditLogs", "metadata", {
      type: DataTypes.JSON,
      allowNull: true
    });
  }
};
