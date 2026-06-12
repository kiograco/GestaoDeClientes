import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.addColumn("ServiceTypes", "code", {
      type: DataTypes.STRING,
      allowNull: true
    });
    await queryInterface.addColumn("ServiceTypes", "technicalDescription", {
      type: DataTypes.TEXT,
      allowNull: true
    });
    await queryInterface.addColumn("ServiceTypes", "categories", {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: []
    });
    await queryInterface.addColumn("ServiceTypes", "averageExecutionTime", {
      type: DataTypes.STRING,
      allowNull: true
    });
    await queryInterface.addColumn("ServiceTypes", "recommendedTechnicians", {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1
    });
    await queryInterface.addColumn("ServiceTypes", "needsReturn", {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    });
    await queryInterface.addColumn("ServiceTypes", "returnQuantity", {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    });
    await queryInterface.addColumn("ServiceTypes", "returnInterval", {
      type: DataTypes.STRING,
      allowNull: true
    });
    await queryInterface.addColumn("ServiceTypes", "orderDefaultText", {
      type: DataTypes.TEXT,
      allowNull: true
    });
    await queryInterface.addColumn("ServiceTypes", "customerRecommendations", {
      type: DataTypes.TEXT,
      allowNull: true
    });
    await queryInterface.addColumn("ServiceTypes", "internalObservation", {
      type: DataTypes.TEXT,
      allowNull: true
    });
    await queryInterface.sequelize.query(`
      UPDATE "ServiceTypes"
      SET "code" = 'SRV-' || LPAD("id"::text, 5, '0')
      WHERE "code" IS NULL
    `);

    await queryInterface.createTable("ServicePests", {
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
      serviceTypeId: {
        type: DataTypes.INTEGER,
        references: { model: "ServiceTypes", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
        allowNull: false
      },
      name: { type: DataTypes.STRING, allowNull: false },
      scientificName: { type: DataTypes.STRING, allowNull: true },
      category: { type: DataTypes.STRING, allowNull: true },
      active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
      createdAt: { type: DataTypes.DATE, allowNull: false },
      updatedAt: { type: DataTypes.DATE, allowNull: false }
    });

    await queryInterface.createTable("ServiceEnvironments", {
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
      serviceTypeId: {
        type: DataTypes.INTEGER,
        references: { model: "ServiceTypes", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
        allowNull: false
      },
      environment: { type: DataTypes.STRING, allowNull: false },
      createdAt: { type: DataTypes.DATE, allowNull: false },
      updatedAt: { type: DataTypes.DATE, allowNull: false }
    });

    await queryInterface.createTable("ServiceMethods", {
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
      serviceTypeId: {
        type: DataTypes.INTEGER,
        references: { model: "ServiceTypes", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
        allowNull: false
      },
      method: { type: DataTypes.STRING, allowNull: false },
      createdAt: { type: DataTypes.DATE, allowNull: false },
      updatedAt: { type: DataTypes.DATE, allowNull: false }
    });

    await queryInterface.createTable("ServiceProducts", {
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
      serviceTypeId: {
        type: DataTypes.INTEGER,
        references: { model: "ServiceTypes", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
        allowNull: false
      },
      inventoryItemId: {
        type: DataTypes.INTEGER,
        references: { model: "ServiceInventoryItems", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
        allowNull: false
      },
      averageConsumption: {
        type: DataTypes.DECIMAL(12, 3),
        allowNull: true
      },
      createdAt: { type: DataTypes.DATE, allowNull: false },
      updatedAt: { type: DataTypes.DATE, allowNull: false }
    });

    await queryInterface.createTable("ServiceWarranties", {
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
      serviceTypeId: {
        type: DataTypes.INTEGER,
        references: { model: "ServiceTypes", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
        allowNull: false
      },
      quantity: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      unit: { type: DataTypes.STRING, allowNull: true },
      observation: { type: DataTypes.TEXT, allowNull: true },
      rules: { type: DataTypes.TEXT, allowNull: true },
      createdAt: { type: DataTypes.DATE, allowNull: false },
      updatedAt: { type: DataTypes.DATE, allowNull: false }
    });

    await queryInterface.addIndex("ServiceTypes", ["tenantId", "code"], {
      unique: true
    });
    await queryInterface.addIndex("ServicePests", ["tenantId", "name"]);
    await queryInterface.addIndex("ServicePests", [
      "tenantId",
      "serviceTypeId"
    ]);
    await queryInterface.addIndex("ServiceEnvironments", [
      "tenantId",
      "environment"
    ]);
    await queryInterface.addIndex("ServiceMethods", ["tenantId", "method"]);
    await queryInterface.addIndex("ServiceProducts", [
      "tenantId",
      "inventoryItemId"
    ]);
    await queryInterface.addIndex("ServiceWarranties", [
      "tenantId",
      "serviceTypeId"
    ]);
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.dropTable("ServiceWarranties");
    await queryInterface.dropTable("ServiceProducts");
    await queryInterface.dropTable("ServiceMethods");
    await queryInterface.dropTable("ServiceEnvironments");
    await queryInterface.dropTable("ServicePests");
    await queryInterface.removeColumn("ServiceTypes", "internalObservation");
    await queryInterface.removeColumn(
      "ServiceTypes",
      "customerRecommendations"
    );
    await queryInterface.removeColumn("ServiceTypes", "orderDefaultText");
    await queryInterface.removeColumn("ServiceTypes", "returnInterval");
    await queryInterface.removeColumn("ServiceTypes", "returnQuantity");
    await queryInterface.removeColumn("ServiceTypes", "needsReturn");
    await queryInterface.removeColumn("ServiceTypes", "recommendedTechnicians");
    await queryInterface.removeColumn("ServiceTypes", "averageExecutionTime");
    await queryInterface.removeColumn("ServiceTypes", "categories");
    await queryInterface.removeColumn("ServiceTypes", "technicalDescription");
    await queryInterface.removeColumn("ServiceTypes", "code");
  }
};
