import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: (queryInterface: QueryInterface) =>
    queryInterface.createTable("AuditLogs", {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
      },
      tenantId: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      action: {
        type: DataTypes.STRING,
        allowNull: false
      },
      resource: {
        type: DataTypes.STRING,
        allowNull: false
      },
      resourceId: {
        type: DataTypes.STRING,
        allowNull: true
      },
      ip: {
        type: DataTypes.STRING,
        allowNull: true
      },
      userAgent: {
        type: DataTypes.STRING,
        allowNull: true
      },
      metadata: {
        type: DataTypes.JSON,
        allowNull: true
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false
      }
    }),

  down: (queryInterface: QueryInterface) => queryInterface.dropTable("AuditLogs")
};
