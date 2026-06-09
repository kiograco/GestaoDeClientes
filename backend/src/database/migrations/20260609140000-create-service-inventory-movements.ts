import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.addColumn("ServiceOrders", "inventoryDeductedAt", {
      type: DataTypes.DATE,
      allowNull: true
    });

    await queryInterface.createTable("ServiceInventoryMovements", {
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
      inventoryItemId: {
        type: DataTypes.INTEGER,
        references: { model: "ServiceInventoryItems", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
        allowNull: false
      },
      serviceOrderId: {
        type: DataTypes.INTEGER,
        references: { model: "ServiceOrders", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
        allowNull: true
      },
      serviceOrderItemId: {
        type: DataTypes.INTEGER,
        references: { model: "ServiceOrderItems", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
        allowNull: true
      },
      userId: {
        type: DataTypes.INTEGER,
        references: { model: "Users", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
        allowNull: true
      },
      movementType: { type: DataTypes.STRING, allowNull: false },
      quantity: { type: DataTypes.INTEGER, allowNull: false },
      previousQuantity: { type: DataTypes.INTEGER, allowNull: false },
      newQuantity: { type: DataTypes.INTEGER, allowNull: false },
      observation: { type: DataTypes.TEXT, allowNull: true },
      createdAt: { type: DataTypes.DATE, allowNull: false },
      updatedAt: { type: DataTypes.DATE, allowNull: false }
    });

    await queryInterface.addIndex("ServiceInventoryMovements", [
      "tenantId",
      "inventoryItemId"
    ]);
    await queryInterface.addIndex("ServiceInventoryMovements", [
      "tenantId",
      "serviceOrderId"
    ]);
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.dropTable("ServiceInventoryMovements");
    await queryInterface.removeColumn("ServiceOrders", "inventoryDeductedAt");
  }
};
