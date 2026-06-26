import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.addColumn("ServiceOrders", "attendanceTypeId", {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: "AttendanceTypes", key: "id" },
      onUpdate: "CASCADE",
      onDelete: "SET NULL"
    });
    await queryInterface.addColumn("Tickets", "attendanceTypeId", {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: "AttendanceTypes", key: "id" },
      onUpdate: "CASCADE",
      onDelete: "SET NULL"
    });
    await queryInterface.addColumn("SalesProposals", "attendanceTypeId", {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: "AttendanceTypes", key: "id" },
      onUpdate: "CASCADE",
      onDelete: "SET NULL"
    });

    await queryInterface.addIndex("ServiceOrders", [
      "tenantId",
      "attendanceTypeId"
    ]);
    await queryInterface.addIndex("Tickets", ["tenantId", "attendanceTypeId"]);
    await queryInterface.addIndex("SalesProposals", [
      "tenantId",
      "attendanceTypeId"
    ]);

    await queryInterface.sequelize.query(`
      UPDATE "ServiceOrders" so
      SET "attendanceTypeId" = at.id
      FROM "AttendanceTypes" at
      WHERE so."attendanceTypeId" IS NULL
        AND so."tenantId" = at."tenantId"
        AND LOWER(so."serviceType") = LOWER(at.name)
        AND at."deletedAt" IS NULL;
    `);

    await queryInterface.sequelize.query(`
      UPDATE "SalesProposals" sp
      SET "attendanceTypeId" = at.id
      FROM "AttendanceTypes" at
      WHERE sp."attendanceTypeId" IS NULL
        AND sp."tenantId" = at."tenantId"
        AND LOWER(sp.title) = LOWER(at.name)
        AND at."deletedAt" IS NULL;
    `);
  },

  down: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.removeColumn("SalesProposals", "attendanceTypeId");
    await queryInterface.removeColumn("Tickets", "attendanceTypeId");
    await queryInterface.removeColumn("ServiceOrders", "attendanceTypeId");
  }
};
