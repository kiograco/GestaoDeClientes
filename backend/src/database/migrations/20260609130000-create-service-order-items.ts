import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.createTable("ServiceOrderItems", {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      tenantId: {
        type: DataTypes.INTEGER,
        references: { model: "Tenants", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
        allowNull: false
      },
      serviceOrderId: {
        type: DataTypes.INTEGER,
        references: { model: "ServiceOrders", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
        allowNull: false
      },
      itemType: { type: DataTypes.STRING, allowNull: false },
      serviceTypeId: {
        type: DataTypes.INTEGER,
        references: { model: "ServiceTypes", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
        allowNull: true
      },
      inventoryItemId: {
        type: DataTypes.INTEGER,
        references: { model: "ServiceInventoryItems", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
        allowNull: true
      },
      description: { type: DataTypes.STRING, allowNull: false },
      quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1
      },
      unitPrice: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0
      },
      totalPrice: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0
      },
      createdAt: { type: DataTypes.DATE, allowNull: false },
      updatedAt: { type: DataTypes.DATE, allowNull: false }
    });

    await queryInterface.addIndex("ServiceOrderItems", [
      "tenantId",
      "serviceOrderId"
    ]);
    await queryInterface.addIndex("ServiceOrderItems", [
      "tenantId",
      "serviceTypeId"
    ]);
    await queryInterface.addIndex("ServiceOrderItems", [
      "tenantId",
      "inventoryItemId"
    ]);
  },

  down: (queryInterface: QueryInterface) =>
    queryInterface.dropTable("ServiceOrderItems")
};
