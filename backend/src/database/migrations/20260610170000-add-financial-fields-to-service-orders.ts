import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.addColumn("ServiceOrders", "financialStatus", {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "nao_cobrado"
    });
    await queryInterface.addColumn("ServiceOrders", "paymentMethod", {
      type: DataTypes.STRING,
      allowNull: true
    });
    await queryInterface.addColumn("ServiceOrders", "chargedAmount", {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true
    });
    await queryInterface.addColumn("ServiceOrders", "paidAmount", {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true
    });
    await queryInterface.addColumn("ServiceOrders", "paymentDueDate", {
      type: DataTypes.DATE,
      allowNull: true
    });
    await queryInterface.addColumn("ServiceOrders", "paidAt", {
      type: DataTypes.DATE,
      allowNull: true
    });
    await queryInterface.addColumn("ServiceOrders", "financialObservation", {
      type: DataTypes.TEXT,
      allowNull: true
    });
    await queryInterface.addIndex("ServiceOrders", [
      "tenantId",
      "financialStatus"
    ]);
    await queryInterface.addIndex("ServiceOrders", [
      "tenantId",
      "paymentDueDate"
    ]);
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.removeIndex("ServiceOrders", [
      "tenantId",
      "paymentDueDate"
    ]);
    await queryInterface.removeIndex("ServiceOrders", [
      "tenantId",
      "financialStatus"
    ]);
    await queryInterface.removeColumn("ServiceOrders", "financialObservation");
    await queryInterface.removeColumn("ServiceOrders", "paidAt");
    await queryInterface.removeColumn("ServiceOrders", "paymentDueDate");
    await queryInterface.removeColumn("ServiceOrders", "paidAmount");
    await queryInterface.removeColumn("ServiceOrders", "chargedAmount");
    await queryInterface.removeColumn("ServiceOrders", "paymentMethod");
    await queryInterface.removeColumn("ServiceOrders", "financialStatus");
  }
};
