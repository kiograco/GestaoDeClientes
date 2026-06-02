import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.addColumn("Tenants", "businessType", {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "generic"
    });
    await queryInterface.addColumn("Tenants", "enabledModules", {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: { delivery: false }
    });

    await queryInterface.createTable("ProductCategories", {
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
      name: { type: DataTypes.STRING, allowNull: false },
      description: { type: DataTypes.TEXT, allowNull: true },
      isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      createdAt: { type: DataTypes.DATE, allowNull: false },
      updatedAt: { type: DataTypes.DATE, allowNull: false }
    });

    await queryInterface.createTable("Products", {
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
      categoryId: {
        type: DataTypes.INTEGER,
        references: { model: "ProductCategories", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
        allowNull: false
      },
      name: { type: DataTypes.STRING, allowNull: false },
      description: { type: DataTypes.TEXT, allowNull: true },
      imageUrl: { type: DataTypes.STRING, allowNull: true },
      basePrice: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
      available: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      saleStartTime: { type: DataTypes.STRING(5), allowNull: true },
      saleEndTime: { type: DataTypes.STRING(5), allowNull: true },
      createdAt: { type: DataTypes.DATE, allowNull: false },
      updatedAt: { type: DataTypes.DATE, allowNull: false }
    });

    await queryInterface.createTable("ProductOptionGroups", {
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
        references: { model: "Products", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
        allowNull: false
      },
      name: { type: DataTypes.STRING, allowNull: false },
      required: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      minSelections: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      maxSelections: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1
      },
      createdAt: { type: DataTypes.DATE, allowNull: false },
      updatedAt: { type: DataTypes.DATE, allowNull: false }
    });

    await queryInterface.createTable("ProductOptions", {
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
      groupId: {
        type: DataTypes.INTEGER,
        references: { model: "ProductOptionGroups", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
        allowNull: false
      },
      name: { type: DataTypes.STRING, allowNull: false },
      price: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0
      },
      available: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      createdAt: { type: DataTypes.DATE, allowNull: false },
      updatedAt: { type: DataTypes.DATE, allowNull: false }
    });

    await queryInterface.addIndex("ProductCategories", ["tenantId", "name"], {
      unique: true
    });
    await queryInterface.addIndex("Products", ["tenantId", "categoryId"]);
    await queryInterface.addIndex("ProductOptionGroups", [
      "tenantId",
      "productId"
    ]);
    await queryInterface.addIndex("ProductOptions", ["tenantId", "groupId"]);
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.dropTable("ProductOptions");
    await queryInterface.dropTable("ProductOptionGroups");
    await queryInterface.dropTable("Products");
    await queryInterface.dropTable("ProductCategories");
    await queryInterface.removeColumn("Tenants", "enabledModules");
    await queryInterface.removeColumn("Tenants", "businessType");
  }
};
