import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.createTable("ServiceInventoryItems", {
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
      name: { type: DataTypes.STRING, allowNull: false },
      sku: { type: DataTypes.STRING, allowNull: true },
      description: { type: DataTypes.TEXT, allowNull: true },
      unit: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: "un"
      },
      quantity: {
        type: DataTypes.DECIMAL(12, 3),
        allowNull: false,
        defaultValue: 0
      },
      minQuantity: {
        type: DataTypes.DECIMAL(12, 3),
        allowNull: false,
        defaultValue: 0
      },
      costPrice: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: true
      },
      salePrice: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: true
      },
      active: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      createdAt: { type: DataTypes.DATE, allowNull: false },
      updatedAt: { type: DataTypes.DATE, allowNull: false }
    });

    await queryInterface.createTable("ServiceTypes", {
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
      name: { type: DataTypes.STRING, allowNull: false },
      description: { type: DataTypes.TEXT, allowNull: true },
      defaultPrice: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: true
      },
      active: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      createdAt: { type: DataTypes.DATE, allowNull: false },
      updatedAt: { type: DataTypes.DATE, allowNull: false }
    });

    await queryInterface.addIndex("ServiceInventoryItems", [
      "tenantId",
      "name"
    ]);
    await queryInterface.addIndex("ServiceInventoryItems", ["tenantId", "sku"]);
    await queryInterface.addIndex("ServiceTypes", ["tenantId", "name"], {
      unique: true
    });
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.dropTable("ServiceTypes");
    await queryInterface.dropTable("ServiceInventoryItems");
  }
};
