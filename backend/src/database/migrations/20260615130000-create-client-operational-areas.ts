import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.createTable("client_areas", {
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
      name: { type: DataTypes.STRING, allowNull: false },
      area_type: { type: DataTypes.STRING, allowNull: true },
      description: { type: DataTypes.TEXT, allowNull: true },
      notes: { type: DataTypes.TEXT, allowNull: true },
      created_at: { type: DataTypes.DATE, allowNull: false },
      updated_at: { type: DataTypes.DATE, allowNull: false },
      deleted_at: { type: DataTypes.DATE, allowNull: true }
    });

    await queryInterface.createTable("client_area_services", {
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
      area_id: {
        type: DataTypes.INTEGER,
        references: { model: "client_areas", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
        allowNull: false
      },
      service_name: { type: DataTypes.STRING, allowNull: false },
      created_at: { type: DataTypes.DATE, allowNull: false },
      updated_at: { type: DataTypes.DATE, allowNull: false },
      deleted_at: { type: DataTypes.DATE, allowNull: true }
    });

    await queryInterface.createTable("client_sectors", {
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
      area_id: {
        type: DataTypes.INTEGER,
        references: { model: "client_areas", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
        allowNull: false
      },
      name: { type: DataTypes.STRING, allowNull: false },
      description: { type: DataTypes.TEXT, allowNull: true },
      notes: { type: DataTypes.TEXT, allowNull: true },
      created_at: { type: DataTypes.DATE, allowNull: false },
      updated_at: { type: DataTypes.DATE, allowNull: false },
      deleted_at: { type: DataTypes.DATE, allowNull: true }
    });

    await queryInterface.addIndex("client_areas", ["tenant_id", "client_id"]);
    await queryInterface.addIndex("client_areas", ["tenant_id", "address_id"]);
    await queryInterface.addIndex("client_areas", [
      "tenant_id",
      "address_id",
      "name"
    ]);
    await queryInterface.addIndex("client_area_services", [
      "tenant_id",
      "area_id"
    ]);
    await queryInterface.addIndex("client_sectors", ["tenant_id", "area_id"]);
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.dropTable("client_sectors");
    await queryInterface.dropTable("client_area_services");
    await queryInterface.dropTable("client_areas");
  }
};
