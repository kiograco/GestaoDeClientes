import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.addColumn("ServiceOrders", "recurrenceType", {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "single"
    });
    await queryInterface.addColumn("ServiceOrders", "recurrenceActive", {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    });
    await queryInterface.addColumn("ServiceOrders", "recurrenceDayOfMonth", {
      type: DataTypes.INTEGER,
      allowNull: true
    });
    await queryInterface.addColumn("ServiceOrders", "recurrenceIntervalDays", {
      type: DataTypes.INTEGER,
      allowNull: true
    });
    await queryInterface.addIndex("ServiceOrders", [
      "tenantId",
      "recurrenceType",
      "recurrenceActive"
    ]);
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.removeIndex("ServiceOrders", [
      "tenantId",
      "recurrenceType",
      "recurrenceActive"
    ]);
    await queryInterface.removeColumn(
      "ServiceOrders",
      "recurrenceIntervalDays"
    );
    await queryInterface.removeColumn("ServiceOrders", "recurrenceDayOfMonth");
    await queryInterface.removeColumn("ServiceOrders", "recurrenceActive");
    await queryInterface.removeColumn("ServiceOrders", "recurrenceType");
  }
};
