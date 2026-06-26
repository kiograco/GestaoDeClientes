import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.createTable("AttendanceTypes", {
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
      name: {
        type: DataTypes.STRING,
        allowNull: false
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false
      },
      deletedAt: {
        type: DataTypes.DATE,
        allowNull: true
      }
    });

    await queryInterface.addIndex("AttendanceTypes", ["tenantId", "isActive"]);
    await queryInterface.addIndex("AttendanceTypes", ["tenantId", "name"]);
    await queryInterface.sequelize.query(`
      CREATE UNIQUE INDEX "AttendanceTypes_tenant_name_active_unique"
      ON "AttendanceTypes" ("tenantId", LOWER("name"))
      WHERE "deletedAt" IS NULL;
    `);
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.dropTable("AttendanceTypes");
  }
};
