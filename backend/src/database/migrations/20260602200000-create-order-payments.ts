import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.createTable("OrderPayments", {
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
      orderId: {
        type: DataTypes.INTEGER,
        references: { model: "Orders", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
        allowNull: false
      },
      method: { type: DataTypes.STRING, allowNull: false },
      status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "PENDING"
      },
      amount: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
      gateway: { type: DataTypes.STRING, allowNull: true },
      externalPaymentId: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true
      },
      externalReference: { type: DataTypes.STRING, allowNull: true },
      pixQrCode: { type: DataTypes.TEXT, allowNull: true },
      pixCopyPaste: { type: DataTypes.TEXT, allowNull: true },
      rawPayload: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
      createdAt: { type: DataTypes.DATE, allowNull: false },
      updatedAt: { type: DataTypes.DATE, allowNull: false }
    });
    await queryInterface.addIndex("OrderPayments", ["tenantId", "orderId"]);
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.dropTable("OrderPayments");
  }
};
