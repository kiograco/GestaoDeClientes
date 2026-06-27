import { Op, QueryInterface } from "sequelize";

const statuses = [
  { code: "rascunho", name: "Rascunho" },
  { code: "agendada", name: "Agendada" },
  { code: "em_atendimento", name: "Em atendimento" },
  { code: "concluida", name: "Concluida" },
  { code: "cancelada", name: "Cancelada" },
  { code: "reagendada", name: "Reagendada" }
];

module.exports = {
  up: async (queryInterface: QueryInterface) => {
    const tenants = (await queryInterface.sequelize.query(
      'SELECT id FROM "Tenants"'
    )) as LegacyAny;
    const now = new Date();
    const rows = tenants[0].flatMap((tenant: { id: number }) =>
      statuses.map(status => ({
        tenantId: tenant.id,
        module: "service-order-statuses",
        code: status.code,
        name: status.name,
        description: null,
        status: "active",
        data: { systemDefault: true },
        createdAt: now,
        updatedAt: now
      }))
    );

    if (rows.length) {
      await queryInterface.bulkInsert("BaseRegisters", rows, {
        ignoreDuplicates: true
      } as LegacyAny);
    }
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.bulkDelete(
      "BaseRegisters",
      {
        module: "service-order-statuses",
        code: { [Op.in]: statuses.map(status => status.code) }
      },
      {}
    );
  }
};
