import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.createTable("clients", {
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
      registration_type: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "person"
      },
      legal_name: { type: DataTypes.STRING, allowNull: false },
      trade_name: { type: DataTypes.STRING, allowNull: true },
      document: { type: DataTypes.STRING, allowNull: true },
      state_registration: { type: DataTypes.STRING, allowNull: true },
      municipal_registration: { type: DataTypes.STRING, allowNull: true },
      activity_sector: { type: DataTypes.STRING, allowNull: true },
      status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "prospect"
      },
      notes: { type: DataTypes.TEXT, allowNull: true },
      created_at: { type: DataTypes.DATE, allowNull: false },
      updated_at: { type: DataTypes.DATE, allowNull: false },
      deleted_at: { type: DataTypes.DATE, allowNull: true }
    });

    await queryInterface.createTable("client_addresses", {
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
      address_type: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "principal"
      },
      linked_document: { type: DataTypes.STRING, allowNull: true },
      zip_code: { type: DataTypes.STRING, allowNull: true },
      street: { type: DataTypes.STRING, allowNull: true },
      number: { type: DataTypes.STRING, allowNull: true },
      complement: { type: DataTypes.STRING, allowNull: true },
      district: { type: DataTypes.STRING, allowNull: true },
      city: { type: DataTypes.STRING, allowNull: true },
      state: { type: DataTypes.STRING, allowNull: true },
      reference: { type: DataTypes.STRING, allowNull: true },
      notes: { type: DataTypes.TEXT, allowNull: true },
      created_at: { type: DataTypes.DATE, allowNull: false },
      updated_at: { type: DataTypes.DATE, allowNull: false },
      deleted_at: { type: DataTypes.DATE, allowNull: true }
    });

    await queryInterface.createTable("client_contacts", {
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
        onDelete: "SET NULL",
        allowNull: true
      },
      name: { type: DataTypes.STRING, allowNull: false },
      role: { type: DataTypes.STRING, allowNull: true },
      phone: { type: DataTypes.STRING, allowNull: true },
      whatsapp: { type: DataTypes.STRING, allowNull: true },
      email: { type: DataTypes.STRING, allowNull: true },
      notes: { type: DataTypes.TEXT, allowNull: true },
      created_at: { type: DataTypes.DATE, allowNull: false },
      updated_at: { type: DataTypes.DATE, allowNull: false },
      deleted_at: { type: DataTypes.DATE, allowNull: true }
    });

    await queryInterface.addIndex("clients", ["tenant_id", "legal_name"]);
    await queryInterface.addIndex("clients", ["tenant_id", "document"]);
    await queryInterface.addIndex("clients", ["tenant_id", "status"]);
    await queryInterface.addIndex("client_addresses", [
      "tenant_id",
      "client_id"
    ]);
    await queryInterface.addIndex("client_contacts", [
      "tenant_id",
      "client_id"
    ]);
    await queryInterface.addIndex("client_contacts", ["tenant_id", "email"]);
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.dropTable("client_contacts");
    await queryInterface.dropTable("client_addresses");
    await queryInterface.dropTable("clients");
  }
};
