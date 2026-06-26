import { QueryInterface } from "sequelize";

const attendanceTypes = [
  "Preventivo",
  "Corretivo",
  "Garantia",
  "Emergencial",
  "Monitoramento",
  "Inspeção"
];

module.exports = {
  up: async (queryInterface: QueryInterface) => {
    const now = new Date();
    await queryInterface.sequelize.query(
      `
        INSERT INTO "AttendanceTypes" ("tenantId", name, description, "isActive", "createdAt", "updatedAt")
        SELECT t.id, seed.name, NULL, true, :now, :now
        FROM "Tenants" t
        CROSS JOIN (VALUES ${attendanceTypes
          .map((_, index) => `(:name${index})`)
          .join(", ")}) AS seed(name)
        WHERE NOT EXISTS (
          SELECT 1
          FROM "AttendanceTypes" at
          WHERE at."tenantId" = t.id
            AND LOWER(at.name) = LOWER(seed.name)
            AND at."deletedAt" IS NULL
        )
      `,
      {
        replacements: attendanceTypes.reduce<Record<string, string | Date>>(
          (acc, name, index) => ({ ...acc, [`name${index}`]: name }),
          { now }
        )
      }
    );
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.sequelize.query(
      `
        DELETE FROM "AttendanceTypes"
        WHERE name IN (:names)
          AND description IS NULL
      `,
      { replacements: { names: attendanceTypes } }
    );
  }
};
