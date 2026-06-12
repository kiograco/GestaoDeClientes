import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.addColumn(
      "ServiceInventoryItems",
      "activeIngredient",
      {
        type: DataTypes.STRING,
        allowNull: true
      }
    );
    await queryInterface.addColumn("ServiceInventoryItems", "chemicalGroup", {
      type: DataTypes.STRING,
      allowNull: true
    });
    await queryInterface.addColumn(
      "ServiceInventoryItems",
      "healthRegistration",
      {
        type: DataTypes.STRING,
        allowNull: true
      }
    );
    await queryInterface.addColumn("ServiceInventoryItems", "manufacturer", {
      type: DataTypes.STRING,
      allowNull: true
    });
    await queryInterface.addColumn("ServiceInventoryItems", "productCategory", {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "outro"
    });
    await queryInterface.addColumn("ServiceInventoryItems", "internalCode", {
      type: DataTypes.STRING,
      allowNull: true
    });
    await queryInterface.addColumn("ServiceInventoryItems", "barcode", {
      type: DataTypes.STRING,
      allowNull: true
    });
    await queryInterface.addColumn(
      "ServiceInventoryItems",
      "lotControlEnabled",
      {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
      }
    );
    await queryInterface.addColumn("ServiceInventoryItems", "showLotOnOrder", {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    });
    await queryInterface.addColumn(
      "ServiceInventoryItems",
      "showLotExpirationOnOrder",
      {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
      }
    );
    await queryInterface.addColumn("ServiceInventoryItems", "diluentTypes", {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: []
    });
    await queryInterface.addColumn(
      "ServiceInventoryItems",
      "applicationMethods",
      {
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: []
      }
    );
    await queryInterface.addColumn(
      "ServiceInventoryItems",
      "showApplicationMethodOnOrder",
      {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
      }
    );
    await queryInterface.addColumn("ServiceInventoryItems", "printSettings", {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {
        commercialName: true,
        activeIngredient: true,
        chemicalGroup: true,
        healthRegistration: true,
        lotNumber: true,
        lotExpiration: true,
        applicationMethod: true,
        dilution: true,
        technicalObservation: true
      }
    });

    await queryInterface.createTable("ServiceInventoryBatches", {
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
      inventoryItemId: {
        type: DataTypes.INTEGER,
        references: { model: "ServiceInventoryItems", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
        allowNull: false
      },
      batchNumber: { type: DataTypes.STRING, allowNull: false },
      manufacturingDate: { type: DataTypes.DATEONLY, allowNull: true },
      expirationDate: { type: DataTypes.DATEONLY, allowNull: true },
      quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      supplier: { type: DataTypes.STRING, allowNull: true },
      observation: { type: DataTypes.TEXT, allowNull: true },
      createdAt: { type: DataTypes.DATE, allowNull: false },
      updatedAt: { type: DataTypes.DATE, allowNull: false }
    });

    await queryInterface.createTable("ServiceInventoryPestRecommendations", {
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
      inventoryItemId: {
        type: DataTypes.INTEGER,
        references: { model: "ServiceInventoryItems", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
        allowNull: false
      },
      pest: { type: DataTypes.STRING, allowNull: false },
      productQuantity: {
        type: DataTypes.DECIMAL(12, 3),
        allowNull: true
      },
      diluentQuantity: {
        type: DataTypes.DECIMAL(12, 3),
        allowNull: true
      },
      unit: { type: DataTypes.STRING(20), allowNull: true },
      actionTime: { type: DataTypes.STRING, allowNull: true },
      technicalObservation: { type: DataTypes.TEXT, allowNull: true },
      createdAt: { type: DataTypes.DATE, allowNull: false },
      updatedAt: { type: DataTypes.DATE, allowNull: false }
    });

    await queryInterface.addColumn("ServiceOrderItems", "inventoryBatchId", {
      type: DataTypes.INTEGER,
      references: { model: "ServiceInventoryBatches", key: "id" },
      onUpdate: "CASCADE",
      onDelete: "SET NULL",
      allowNull: true
    });
    await queryInterface.addColumn("ServiceOrderItems", "pestTarget", {
      type: DataTypes.STRING,
      allowNull: true
    });
    await queryInterface.addColumn("ServiceOrderItems", "applicationMethod", {
      type: DataTypes.STRING,
      allowNull: true
    });
    await queryInterface.addColumn("ServiceOrderItems", "dilutionUsed", {
      type: DataTypes.STRING,
      allowNull: true
    });
    await queryInterface.addColumn(
      "ServiceOrderItems",
      "technicalObservation",
      {
        type: DataTypes.TEXT,
        allowNull: true
      }
    );

    await queryInterface.addColumn(
      "ServiceInventoryMovements",
      "inventoryBatchId",
      {
        type: DataTypes.INTEGER,
        references: { model: "ServiceInventoryBatches", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
        allowNull: true
      }
    );
    await queryInterface.addColumn("ServiceInventoryMovements", "unitCost", {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true
    });
    await queryInterface.addColumn("ServiceInventoryMovements", "totalCost", {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true
    });
    await queryInterface.addColumn("ServiceInventoryMovements", "pestTarget", {
      type: DataTypes.STRING,
      allowNull: true
    });

    await queryInterface.addIndex("ServiceInventoryItems", [
      "tenantId",
      "manufacturer"
    ]);
    await queryInterface.addIndex("ServiceInventoryItems", [
      "tenantId",
      "productCategory"
    ]);
    await queryInterface.addIndex("ServiceInventoryBatches", [
      "tenantId",
      "inventoryItemId"
    ]);
    await queryInterface.addIndex("ServiceInventoryBatches", [
      "tenantId",
      "expirationDate"
    ]);
    await queryInterface.addIndex("ServiceInventoryPestRecommendations", [
      "tenantId",
      "pest"
    ]);
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.removeColumn(
      "ServiceInventoryMovements",
      "pestTarget"
    );
    await queryInterface.removeColumn("ServiceInventoryMovements", "totalCost");
    await queryInterface.removeColumn("ServiceInventoryMovements", "unitCost");
    await queryInterface.removeColumn(
      "ServiceInventoryMovements",
      "inventoryBatchId"
    );
    await queryInterface.removeColumn(
      "ServiceOrderItems",
      "technicalObservation"
    );
    await queryInterface.removeColumn("ServiceOrderItems", "dilutionUsed");
    await queryInterface.removeColumn("ServiceOrderItems", "applicationMethod");
    await queryInterface.removeColumn("ServiceOrderItems", "pestTarget");
    await queryInterface.removeColumn("ServiceOrderItems", "inventoryBatchId");
    await queryInterface.dropTable("ServiceInventoryPestRecommendations");
    await queryInterface.dropTable("ServiceInventoryBatches");
    await queryInterface.removeColumn("ServiceInventoryItems", "printSettings");
    await queryInterface.removeColumn(
      "ServiceInventoryItems",
      "showApplicationMethodOnOrder"
    );
    await queryInterface.removeColumn(
      "ServiceInventoryItems",
      "applicationMethods"
    );
    await queryInterface.removeColumn("ServiceInventoryItems", "diluentTypes");
    await queryInterface.removeColumn(
      "ServiceInventoryItems",
      "showLotExpirationOnOrder"
    );
    await queryInterface.removeColumn(
      "ServiceInventoryItems",
      "showLotOnOrder"
    );
    await queryInterface.removeColumn(
      "ServiceInventoryItems",
      "lotControlEnabled"
    );
    await queryInterface.removeColumn("ServiceInventoryItems", "barcode");
    await queryInterface.removeColumn("ServiceInventoryItems", "internalCode");
    await queryInterface.removeColumn(
      "ServiceInventoryItems",
      "productCategory"
    );
    await queryInterface.removeColumn("ServiceInventoryItems", "manufacturer");
    await queryInterface.removeColumn(
      "ServiceInventoryItems",
      "healthRegistration"
    );
    await queryInterface.removeColumn("ServiceInventoryItems", "chemicalGroup");
    await queryInterface.removeColumn(
      "ServiceInventoryItems",
      "activeIngredient"
    );
  }
};
