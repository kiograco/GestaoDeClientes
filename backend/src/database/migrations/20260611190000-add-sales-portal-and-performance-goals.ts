import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.addColumn("SalesProposals", "publicToken", {
      type: DataTypes.STRING,
      allowNull: true
    });
    await queryInterface.addColumn("SalesProposals", "approvedAt", {
      type: DataTypes.DATE,
      allowNull: true
    });
    await queryInterface.addIndex("SalesProposals", ["publicToken"], {
      unique: true
    });

    await queryInterface.createTable("PerformanceGoals", {
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
      roleType: {
        type: DataTypes.STRING,
        allowNull: false
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: "Users", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE"
      },
      attendantId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: "ServiceAttendants", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE"
      },
      periodMonth: {
        type: DataTypes.STRING,
        allowNull: false
      },
      targetCount: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      targetValue: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0
      },
      active: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
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
    await queryInterface.addIndex("PerformanceGoals", [
      "tenantId",
      "roleType",
      "periodMonth"
    ]);
    await queryInterface.addIndex("PerformanceGoals", [
      "tenantId",
      "roleType",
      "periodMonth",
      "userId"
    ]);
    await queryInterface.addIndex("PerformanceGoals", [
      "tenantId",
      "roleType",
      "periodMonth",
      "attendantId"
    ]);
  },

  down: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.dropTable("PerformanceGoals");
    await queryInterface.removeIndex("SalesProposals", ["publicToken"]);
    await queryInterface.removeColumn("SalesProposals", "approvedAt");
    await queryInterface.removeColumn("SalesProposals", "publicToken");
  }
};
