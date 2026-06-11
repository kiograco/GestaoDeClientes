import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.createTable("SalesOpportunities", {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
      },
      tenantId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: "Tenants", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE"
      },
      contactId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: "Contacts", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE"
      },
      ownerUserId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: "Users", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "SET NULL"
      },
      convertedServiceOrderId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: "ServiceOrders", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "SET NULL"
      },
      title: { type: DataTypes.STRING, allowNull: false },
      description: { type: DataTypes.TEXT, allowNull: true },
      stage: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "novo"
      },
      estimatedValue: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0
      },
      expectedCloseDate: { type: DataTypes.DATE, allowNull: true },
      source: { type: DataTypes.STRING, allowNull: true },
      lostReason: { type: DataTypes.STRING, allowNull: true },
      notes: { type: DataTypes.TEXT, allowNull: true },
      wonAt: { type: DataTypes.DATE, allowNull: true },
      lostAt: { type: DataTypes.DATE, allowNull: true },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      }
    });
    await queryInterface.addIndex("SalesOpportunities", ["tenantId", "stage"]);
    await queryInterface.addIndex("SalesOpportunities", [
      "tenantId",
      "contactId"
    ]);
    await queryInterface.addIndex("SalesOpportunities", [
      "tenantId",
      "ownerUserId"
    ]);
    await queryInterface.addIndex("SalesOpportunities", [
      "tenantId",
      "expectedCloseDate"
    ]);

    await queryInterface.createTable("SalesOpportunityLogs", {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
      },
      salesOpportunityId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: "SalesOpportunities", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE"
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: "Users", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "SET NULL"
      },
      action: { type: DataTypes.STRING, allowNull: false },
      oldValue: { type: DataTypes.JSON, allowNull: true },
      newValue: { type: DataTypes.JSON, allowNull: true },
      description: { type: DataTypes.STRING, allowNull: true },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      }
    });
    await queryInterface.addIndex("SalesOpportunityLogs", [
      "salesOpportunityId"
    ]);
    await queryInterface.addIndex("SalesOpportunityLogs", ["userId"]);
  },

  down: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.dropTable("SalesOpportunityLogs");
    await queryInterface.dropTable("SalesOpportunities");
  }
};
