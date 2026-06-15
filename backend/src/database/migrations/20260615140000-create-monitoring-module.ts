import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.createTable("trap_types", {
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
      code: { type: DataTypes.STRING, allowNull: false },
      type: { type: DataTypes.STRING, allowNull: false },
      description: { type: DataTypes.TEXT, allowNull: true },
      active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
      created_at: { type: DataTypes.DATE, allowNull: false },
      updated_at: { type: DataTypes.DATE, allowNull: false },
      deleted_at: { type: DataTypes.DATE, allowNull: true }
    });

    await queryInterface.createTable("monitoring_points", {
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
      client_id: {
        type: DataTypes.INTEGER,
        references: { model: "clients", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
        allowNull: false
      },
      address_id: {
        type: DataTypes.INTEGER,
        references: { model: "client_addresses", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
        allowNull: false
      },
      area_id: {
        type: DataTypes.INTEGER,
        references: { model: "client_areas", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
        allowNull: false
      },
      sector_id: {
        type: DataTypes.INTEGER,
        references: { model: "client_sectors", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
        allowNull: false
      },
      trap_type_id: {
        type: DataTypes.INTEGER,
        references: { model: "trap_types", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
        allowNull: false
      },
      owner: { type: DataTypes.STRING, allowNull: false },
      installed_at: { type: DataTypes.DATE, allowNull: false },
      point_number: { type: DataTypes.INTEGER, allowNull: false },
      label: { type: DataTypes.STRING, allowNull: false },
      notes: { type: DataTypes.TEXT, allowNull: true },
      active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
      created_at: { type: DataTypes.DATE, allowNull: false },
      updated_at: { type: DataTypes.DATE, allowNull: false },
      deleted_at: { type: DataTypes.DATE, allowNull: true }
    });

    await queryInterface.createTable("monitoring_point_history", {
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
      action: { type: DataTypes.STRING, allowNull: false },
      previous_area_id: {
        type: DataTypes.INTEGER,
        references: { model: "client_areas", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
        allowNull: true
      },
      new_area_id: {
        type: DataTypes.INTEGER,
        references: { model: "client_areas", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
        allowNull: true
      },
      previous_sector_id: {
        type: DataTypes.INTEGER,
        references: { model: "client_sectors", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
        allowNull: true
      },
      new_sector_id: {
        type: DataTypes.INTEGER,
        references: { model: "client_sectors", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
        allowNull: true
      },
      notes: { type: DataTypes.TEXT, allowNull: true },
      metadata: { type: DataTypes.JSONB, allowNull: true },
      created_at: { type: DataTypes.DATE, allowNull: false }
    });

    await queryInterface.addIndex("trap_types", ["tenant_id", "code"], {
      unique: true
    });
    await queryInterface.addIndex("monitoring_points", [
      "tenant_id",
      "sector_id"
    ]);
    await queryInterface.addIndex("monitoring_points", [
      "tenant_id",
      "client_id",
      "point_number"
    ]);
    await queryInterface.addIndex("monitoring_point_history", [
      "tenant_id",
      "monitoring_point_id"
    ]);
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.dropTable("monitoring_point_history");
    await queryInterface.dropTable("monitoring_points");
    await queryInterface.dropTable("trap_types");
  }
};
