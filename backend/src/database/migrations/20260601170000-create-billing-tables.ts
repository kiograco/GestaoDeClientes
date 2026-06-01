import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.createTable("Plans", {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
      },
      name: { type: DataTypes.STRING, allowNull: false },
      price: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
      durationDays: { type: DataTypes.INTEGER, allowNull: false },
      limits: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
      isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      createdAt: { type: DataTypes.DATE, allowNull: false },
      updatedAt: { type: DataTypes.DATE, allowNull: false }
    });

    await queryInterface.createTable("Subscriptions", {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
      },
      companyId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: "Tenants", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE"
      },
      planId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: "Plans", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT"
      },
      gateway: { type: DataTypes.STRING, allowNull: false },
      externalCustomerId: { type: DataTypes.STRING, allowNull: true },
      externalSubscriptionId: { type: DataTypes.STRING, allowNull: true },
      status: { type: DataTypes.STRING, allowNull: false },
      currentPeriodStart: { type: DataTypes.DATE, allowNull: true },
      currentPeriodEnd: { type: DataTypes.DATE, allowNull: true },
      createdAt: { type: DataTypes.DATE, allowNull: false },
      updatedAt: { type: DataTypes.DATE, allowNull: false }
    });

    await queryInterface.createTable("Payments", {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
      },
      companyId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: "Tenants", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE"
      },
      subscriptionId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: "Subscriptions", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE"
      },
      planId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: "Plans", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT"
      },
      gateway: { type: DataTypes.STRING, allowNull: false },
      externalPaymentId: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
      },
      amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
      method: { type: DataTypes.STRING, allowNull: false },
      dueDate: { type: DataTypes.DATEONLY, allowNull: false },
      status: { type: DataTypes.STRING, allowNull: false },
      paymentUrl: { type: DataTypes.TEXT, allowNull: true },
      pixQrCode: { type: DataTypes.TEXT, allowNull: true },
      pixCopyPaste: { type: DataTypes.TEXT, allowNull: true },
      renewalAppliedAt: { type: DataTypes.DATE, allowNull: true },
      rawPayload: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
      createdAt: { type: DataTypes.DATE, allowNull: false },
      updatedAt: { type: DataTypes.DATE, allowNull: false }
    });

    await queryInterface.createTable("PaymentWebhookEvents", {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
      },
      gateway: { type: DataTypes.STRING, allowNull: false },
      externalEventId: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
      },
      eventType: { type: DataTypes.STRING, allowNull: false },
      externalPaymentId: { type: DataTypes.STRING, allowNull: true },
      processedAt: { type: DataTypes.DATE, allowNull: true },
      rawPayload: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
      createdAt: { type: DataTypes.DATE, allowNull: false }
    });

    const now = new Date();
    await queryInterface.bulkInsert("Plans", [
      {
        name: "Mensal",
        price: 99.9,
        durationDays: 30,
        limits: JSON.stringify({ maxUsers: 10, maxConnections: 5 }),
        isActive: true,
        createdAt: now,
        updatedAt: now
      },
      {
        name: "Trimestral",
        price: 279.9,
        durationDays: 90,
        limits: JSON.stringify({ maxUsers: 10, maxConnections: 5 }),
        isActive: true,
        createdAt: now,
        updatedAt: now
      },
      {
        name: "Anual",
        price: 999.9,
        durationDays: 365,
        limits: JSON.stringify({ maxUsers: 10, maxConnections: 5 }),
        isActive: true,
        createdAt: now,
        updatedAt: now
      }
    ]);
  },

  down: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.dropTable("PaymentWebhookEvents");
    await queryInterface.dropTable("Payments");
    await queryInterface.dropTable("Subscriptions");
    await queryInterface.dropTable("Plans");
  }
};
