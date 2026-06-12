import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.createTable("Pests", {
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
      commonName: { type: DataTypes.STRING, allowNull: false },
      scientificName: { type: DataTypes.STRING, allowNull: false },
      createdAt: { type: DataTypes.DATE, allowNull: false },
      updatedAt: { type: DataTypes.DATE, allowNull: false }
    });

    await queryInterface.addIndex("Pests", ["tenantId", "commonName"], {
      unique: true
    });
    await queryInterface.addIndex("Pests", ["tenantId", "scientificName"], {
      unique: true
    });

    await queryInterface.createTable("ProductPests", {
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
      productId: {
        type: DataTypes.INTEGER,
        references: { model: "ServiceInventoryItems", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
        allowNull: false
      },
      pestId: {
        type: DataTypes.INTEGER,
        references: { model: "Pests", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
        allowNull: false
      },
      createdAt: { type: DataTypes.DATE, allowNull: false },
      updatedAt: { type: DataTypes.DATE, allowNull: false }
    });
    await queryInterface.addIndex(
      "ProductPests",
      ["tenantId", "productId", "pestId"],
      { unique: true }
    );

    await queryInterface.addColumn("ServicePests", "pestId", {
      type: DataTypes.INTEGER,
      references: { model: "Pests", key: "id" },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
      allowNull: true
    });
    await queryInterface.addColumn(
      "ServiceInventoryPestRecommendations",
      "pestId",
      {
        type: DataTypes.INTEGER,
        references: { model: "Pests", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
        allowNull: true
      }
    );

    await queryInterface.sequelize.query(`
      INSERT INTO "Pests" ("tenantId", "commonName", "scientificName", "createdAt", "updatedAt")
      SELECT DISTINCT source."tenantId", source."commonName", source."scientificName", NOW(), NOW()
      FROM (
        SELECT "tenantId", TRIM("pest") AS "commonName", TRIM("pest") AS "scientificName"
        FROM "ServiceInventoryPestRecommendations"
        WHERE COALESCE(TRIM("pest"), '') <> ''
        UNION
        SELECT "tenantId", TRIM("name") AS "commonName", COALESCE(NULLIF(TRIM("scientificName"), ''), TRIM("name")) AS "scientificName"
        FROM "ServicePests"
        WHERE COALESCE(TRIM("name"), '') <> ''
      ) source
      ON CONFLICT ("tenantId", "commonName") DO NOTHING
    `);

    await queryInterface.sequelize.query(`
      UPDATE "ServiceInventoryPestRecommendations" rec
      SET "pestId" = pest.id
      FROM "Pests" pest
      WHERE pest."tenantId" = rec."tenantId"
        AND pest."commonName" = TRIM(rec."pest")
    `);

    await queryInterface.sequelize.query(`
      INSERT INTO "ProductPests" ("tenantId", "productId", "pestId", "createdAt", "updatedAt")
      SELECT DISTINCT rec."tenantId", rec."inventoryItemId", rec."pestId", NOW(), NOW()
      FROM "ServiceInventoryPestRecommendations" rec
      WHERE rec."pestId" IS NOT NULL
      ON CONFLICT ("tenantId", "productId", "pestId") DO NOTHING
    `);

    await queryInterface.sequelize.query(`
      UPDATE "ServicePests" service_pest
      SET "pestId" = pest.id
      FROM "Pests" pest
      WHERE pest."tenantId" = service_pest."tenantId"
        AND pest."commonName" = TRIM(service_pest."name")
    `);

    await queryInterface.changeColumn(
      "ServiceInventoryPestRecommendations",
      "pestId",
      {
        type: DataTypes.INTEGER,
        references: { model: "Pests", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
        allowNull: false
      }
    );
    await queryInterface.changeColumn("ServicePests", "pestId", {
      type: DataTypes.INTEGER,
      references: { model: "Pests", key: "id" },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
      allowNull: false
    });

    await queryInterface.removeColumn(
      "ServiceInventoryPestRecommendations",
      "pest"
    );
    await queryInterface.removeColumn("ServicePests", "name");
    await queryInterface.removeColumn("ServicePests", "scientificName");
    await queryInterface.removeColumn("ServicePests", "category");
    await queryInterface.removeColumn("ServicePests", "active");

    await queryInterface.addIndex(
      "ServicePests",
      ["tenantId", "serviceTypeId", "pestId"],
      { unique: true }
    );
    await queryInterface.addIndex(
      "ServiceInventoryPestRecommendations",
      ["tenantId", "inventoryItemId", "pestId"],
      { unique: true }
    );
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.addColumn("ServicePests", "active", {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    });
    await queryInterface.addColumn("ServicePests", "category", {
      type: DataTypes.STRING,
      allowNull: true
    });
    await queryInterface.addColumn("ServicePests", "scientificName", {
      type: DataTypes.STRING,
      allowNull: true
    });
    await queryInterface.addColumn("ServicePests", "name", {
      type: DataTypes.STRING,
      allowNull: true
    });
    await queryInterface.addColumn(
      "ServiceInventoryPestRecommendations",
      "pest",
      {
        type: DataTypes.STRING,
        allowNull: true
      }
    );
    await queryInterface.sequelize.query(`
      UPDATE "ServicePests" service_pest
      SET "name" = pest."commonName", "scientificName" = pest."scientificName"
      FROM "Pests" pest
      WHERE pest.id = service_pest."pestId"
    `);
    await queryInterface.sequelize.query(`
      UPDATE "ServiceInventoryPestRecommendations" rec
      SET "pest" = pest."commonName"
      FROM "Pests" pest
      WHERE pest.id = rec."pestId"
    `);
    await queryInterface.removeColumn(
      "ServiceInventoryPestRecommendations",
      "pestId"
    );
    await queryInterface.removeColumn("ServicePests", "pestId");
    await queryInterface.dropTable("ProductPests");
    await queryInterface.dropTable("Pests");
  }
};
