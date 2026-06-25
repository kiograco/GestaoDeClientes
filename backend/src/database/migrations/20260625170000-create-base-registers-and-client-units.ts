import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.createTable("BaseRegisters", {
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
      module: {
        type: DataTypes.STRING(60),
        allowNull: false
      },
      code: {
        type: DataTypes.STRING(80),
        allowNull: true
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      status: {
        type: DataTypes.STRING(30),
        allowNull: false,
        defaultValue: "active"
      },
      data: {
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: {}
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

    await queryInterface.createTable("ClientUnits", {
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
      clientId: {
        type: DataTypes.INTEGER,
        references: { model: "clients", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
        allowNull: false
      },
      code: {
        type: DataTypes.STRING(80),
        allowNull: true
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false
      },
      responsibleName: {
        type: DataTypes.STRING,
        allowNull: true
      },
      phone: {
        type: DataTypes.STRING,
        allowNull: true
      },
      email: {
        type: DataTypes.STRING,
        allowNull: true
      },
      zipCode: {
        type: DataTypes.STRING,
        allowNull: true
      },
      street: {
        type: DataTypes.STRING,
        allowNull: true
      },
      number: {
        type: DataTypes.STRING,
        allowNull: true
      },
      complement: {
        type: DataTypes.STRING,
        allowNull: true
      },
      neighborhood: {
        type: DataTypes.STRING,
        allowNull: true
      },
      city: {
        type: DataTypes.STRING,
        allowNull: true
      },
      state: {
        type: DataTypes.STRING(2),
        allowNull: true
      },
      latitude: {
        type: DataTypes.DECIMAL(10, 7),
        allowNull: true
      },
      longitude: {
        type: DataTypes.DECIMAL(10, 7),
        allowNull: true
      },
      status: {
        type: DataTypes.STRING(30),
        allowNull: false,
        defaultValue: "active"
      },
      observations: {
        type: DataTypes.TEXT,
        allowNull: true
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

    await queryInterface.addIndex("BaseRegisters", [
      "tenantId",
      "module",
      "name"
    ]);
    await queryInterface.addIndex("BaseRegisters", [
      "tenantId",
      "module",
      "code"
    ]);
    await queryInterface.addIndex("BaseRegisters", [
      "tenantId",
      "module",
      "status"
    ]);
    await queryInterface.addIndex("ClientUnits", ["tenantId", "clientId"]);
    await queryInterface.addIndex("ClientUnits", ["tenantId", "name"]);
    await queryInterface.addIndex("ClientUnits", ["tenantId", "code"]);
    await queryInterface.addIndex("ClientUnits", ["tenantId", "status"]);
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.dropTable("ClientUnits");
    await queryInterface.dropTable("BaseRegisters");
  }
};
