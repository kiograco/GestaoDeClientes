import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.createTable("Orders", {
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
        onDelete: "RESTRICT",
        allowNull: false
      },
      ticketId: {
        type: DataTypes.INTEGER,
        references: { model: "Tickets", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
        allowNull: true
      },
      originChannel: { type: DataTypes.STRING, allowNull: false },
      status: { type: DataTypes.STRING, allowNull: false, defaultValue: "NEW" },
      deliveryType: { type: DataTypes.STRING, allowNull: false },
      subtotal: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
      deliveryFee: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0
      },
      discount: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0
      },
      total: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
      deliveryAddressSnapshot: { type: DataTypes.JSONB, allowNull: true },
      notes: { type: DataTypes.TEXT, allowNull: true },
      createdAt: { type: DataTypes.DATE, allowNull: false },
      updatedAt: { type: DataTypes.DATE, allowNull: false }
    });
    await queryInterface.createTable("OrderItems", {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      orderId: {
        type: DataTypes.INTEGER,
        references: { model: "Orders", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
        allowNull: false
      },
      productId: {
        type: DataTypes.INTEGER,
        references: { model: "Products", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
        allowNull: true
      },
      productNameSnapshot: { type: DataTypes.STRING, allowNull: false },
      productDescriptionSnapshot: { type: DataTypes.TEXT, allowNull: true },
      unitPriceSnapshot: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
      quantity: { type: DataTypes.INTEGER, allowNull: false },
      notes: { type: DataTypes.TEXT, allowNull: true },
      total: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
      createdAt: { type: DataTypes.DATE, allowNull: false },
      updatedAt: { type: DataTypes.DATE, allowNull: false }
    });
    await queryInterface.createTable("OrderItemOptions", {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      orderItemId: {
        type: DataTypes.INTEGER,
        references: { model: "OrderItems", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
        allowNull: false
      },
      optionNameSnapshot: { type: DataTypes.STRING, allowNull: false },
      optionPriceSnapshot: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
      createdAt: { type: DataTypes.DATE, allowNull: false },
      updatedAt: { type: DataTypes.DATE, allowNull: false }
    });
    await queryInterface.createTable("OrderStatusHistories", {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      orderId: {
        type: DataTypes.INTEGER,
        references: { model: "Orders", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
        allowNull: false
      },
      oldStatus: { type: DataTypes.STRING, allowNull: true },
      newStatus: { type: DataTypes.STRING, allowNull: false },
      changedBy: {
        type: DataTypes.INTEGER,
        references: { model: "Users", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
        allowNull: true
      },
      createdAt: { type: DataTypes.DATE, allowNull: false },
      updatedAt: { type: DataTypes.DATE, allowNull: false }
    });
    await queryInterface.addIndex("Orders", ["tenantId", "status"]);
    await queryInterface.addIndex("Orders", ["tenantId", "contactId"]);
    await queryInterface.addIndex("OrderItems", ["orderId"]);
    await queryInterface.addIndex("OrderItemOptions", ["orderItemId"]);
    await queryInterface.addIndex("OrderStatusHistories", ["orderId"]);
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.dropTable("OrderStatusHistories");
    await queryInterface.dropTable("OrderItemOptions");
    await queryInterface.dropTable("OrderItems");
    await queryInterface.dropTable("Orders");
  }
};
