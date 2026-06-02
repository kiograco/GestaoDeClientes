import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.createTable("CustomerAddresses", {
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
      contactId: {
        type: DataTypes.INTEGER,
        references: { model: "Contacts", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
        allowNull: false
      },
      label: { type: DataTypes.STRING, allowNull: false },
      street: { type: DataTypes.STRING, allowNull: false },
      number: { type: DataTypes.STRING, allowNull: false },
      district: { type: DataTypes.STRING, allowNull: false },
      city: { type: DataTypes.STRING, allowNull: false },
      state: { type: DataTypes.STRING(2), allowNull: false },
      zipCode: { type: DataTypes.STRING(8), allowNull: false },
      complement: { type: DataTypes.STRING, allowNull: true },
      reference: { type: DataTypes.STRING, allowNull: true },
      isDefault: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      createdAt: { type: DataTypes.DATE, allowNull: false },
      updatedAt: { type: DataTypes.DATE, allowNull: false }
    });
    await queryInterface.createTable("DeliveryZones", {
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
      district: { type: DataTypes.STRING, allowNull: true },
      zipCodeStart: { type: DataTypes.STRING(8), allowNull: true },
      zipCodeEnd: { type: DataTypes.STRING(8), allowNull: true },
      deliveryFee: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
      estimatedMinutes: { type: DataTypes.INTEGER, allowNull: false },
      active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
      createdAt: { type: DataTypes.DATE, allowNull: false },
      updatedAt: { type: DataTypes.DATE, allowNull: false }
    });
    await queryInterface.addIndex("CustomerAddresses", [
      "tenantId",
      "contactId"
    ]);
    await queryInterface.addIndex("DeliveryZones", ["tenantId", "district"]);
    await queryInterface.addIndex("DeliveryZones", [
      "tenantId",
      "zipCodeStart",
      "zipCodeEnd"
    ]);
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.dropTable("DeliveryZones");
    await queryInterface.dropTable("CustomerAddresses");
  }
};
