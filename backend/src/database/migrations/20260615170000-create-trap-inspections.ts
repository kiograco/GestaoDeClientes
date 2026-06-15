import { QueryInterface, DataTypes } from "sequelize";

const conditionNames = [
  "Instalada",
  "Avariada",
  "Extraviada",
  "Sem acesso",
  "Suja"
];

const actionNames = [
  "Isca trocada por avaria",
  "Isca trocada por consumo",
  "Manutenção e limpeza",
  "Monitorada",
  "Refil trocado",
  "Isca intacta",
  "Refil intacto",
  "Armadilha substituída",
  "Pedir reposição",
  "Troca de adesivo"
];

module.exports = {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.addColumn("trap_types", "acronym", {
      type: DataTypes.STRING,
      allowNull: true
    });
    await queryInterface.sequelize.query(
      'UPDATE "trap_types" SET "acronym" = "code" WHERE "acronym" IS NULL'
    );

    await queryInterface.createTable("trap_type_pests", {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      tenant_id: {
        type: DataTypes.INTEGER,
        references: { model: "Tenants", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
        allowNull: false
      },
      trap_type_id: {
        type: DataTypes.INTEGER,
        references: { model: "trap_types", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
        allowNull: false
      },
      pest_id: {
        type: DataTypes.INTEGER,
        references: { model: "Pests", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
        allowNull: false
      },
      created_at: { type: DataTypes.DATE, allowNull: false },
      updated_at: { type: DataTypes.DATE, allowNull: false }
    });

    await queryInterface.createTable("trap_conditions", {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      tenant_id: {
        type: DataTypes.INTEGER,
        references: { model: "Tenants", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
        allowNull: false
      },
      name: { type: DataTypes.STRING, allowNull: false },
      active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
      created_at: { type: DataTypes.DATE, allowNull: false },
      updated_at: { type: DataTypes.DATE, allowNull: false }
    });

    await queryInterface.createTable("trap_actions", {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      tenant_id: {
        type: DataTypes.INTEGER,
        references: { model: "Tenants", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
        allowNull: false
      },
      name: { type: DataTypes.STRING, allowNull: false },
      active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
      created_at: { type: DataTypes.DATE, allowNull: false },
      updated_at: { type: DataTypes.DATE, allowNull: false }
    });

    await queryInterface.createTable("trap_inspections", {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      tenant_id: {
        type: DataTypes.INTEGER,
        references: { model: "Tenants", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
        allowNull: false
      },
      monitoring_point_id: {
        type: DataTypes.INTEGER,
        references: { model: "monitoring_points", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
        allowNull: false
      },
      technician_id: {
        type: DataTypes.INTEGER,
        references: { model: "Users", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
        allowNull: true
      },
      inspection_date: { type: DataTypes.DATE, allowNull: false },
      notes: { type: DataTypes.TEXT, allowNull: true },
      created_at: { type: DataTypes.DATE, allowNull: false },
      updated_at: { type: DataTypes.DATE, allowNull: false }
    });

    await queryInterface.createTable("trap_inspection_conditions", {
      inspection_id: {
        type: DataTypes.INTEGER,
        references: { model: "trap_inspections", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
        allowNull: false
      },
      condition_id: {
        type: DataTypes.INTEGER,
        references: { model: "trap_conditions", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
        allowNull: false
      },
      tenant_id: { type: DataTypes.INTEGER, allowNull: false }
    });

    await queryInterface.createTable("trap_inspection_actions", {
      inspection_id: {
        type: DataTypes.INTEGER,
        references: { model: "trap_inspections", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
        allowNull: false
      },
      action_id: {
        type: DataTypes.INTEGER,
        references: { model: "trap_actions", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
        allowNull: false
      },
      tenant_id: { type: DataTypes.INTEGER, allowNull: false }
    });

    await queryInterface.addIndex("trap_types", ["tenant_id", "acronym"]);
    await queryInterface.addIndex(
      "trap_type_pests",
      ["tenant_id", "trap_type_id", "pest_id"],
      { unique: true }
    );
    await queryInterface.addIndex("trap_conditions", ["tenant_id", "name"], {
      unique: true
    });
    await queryInterface.addIndex("trap_actions", ["tenant_id", "name"], {
      unique: true
    });
    await queryInterface.addIndex("trap_inspections", [
      "tenant_id",
      "monitoring_point_id",
      "inspection_date"
    ]);
    await queryInterface.addIndex(
      "trap_inspection_conditions",
      ["tenant_id", "inspection_id", "condition_id"],
      { unique: true }
    );
    await queryInterface.addIndex(
      "trap_inspection_actions",
      ["tenant_id", "inspection_id", "action_id"],
      { unique: true }
    );

    const tenants = (await queryInterface.sequelize.query(
      'SELECT id FROM "Tenants"',
      { type: "SELECT" }
    )) as Array<{ id: number }>;
    const now = new Date();
    await Promise.all(
      tenants.map(tenant =>
        queryInterface.bulkInsert(
          "trap_conditions",
          conditionNames.map(name => ({
            tenant_id: tenant.id,
            name,
            active: true,
            created_at: now,
            updated_at: now
          }))
        )
      )
    );
    await Promise.all(
      tenants.map(tenant =>
        queryInterface.bulkInsert(
          "trap_actions",
          actionNames.map(name => ({
            tenant_id: tenant.id,
            name,
            active: true,
            created_at: now,
            updated_at: now
          }))
        )
      )
    );
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.dropTable("trap_inspection_actions");
    await queryInterface.dropTable("trap_inspection_conditions");
    await queryInterface.dropTable("trap_inspections");
    await queryInterface.dropTable("trap_actions");
    await queryInterface.dropTable("trap_conditions");
    await queryInterface.dropTable("trap_type_pests");
    await queryInterface.removeColumn("trap_types", "acronym");
  }
};
