import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.createTable("CustomerProfiles", {
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
      contactId: {
        type: DataTypes.INTEGER,
        references: { model: "Contacts", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
        allowNull: false,
        unique: true
      },
      document: { type: DataTypes.STRING(14), allowNull: true },
      secondaryPhone: { type: DataTypes.STRING, allowNull: true },
      companyName: { type: DataTypes.STRING, allowNull: true },
      birthDate: { type: DataTypes.DATEONLY, allowNull: true },
      salesStatus: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "LEAD"
      },
      source: { type: DataTypes.STRING, allowNull: true },
      notes: { type: DataTypes.TEXT, allowNull: true },
      createdAt: { type: DataTypes.DATE, allowNull: false },
      updatedAt: { type: DataTypes.DATE, allowNull: false }
    });
    await queryInterface.addIndex("CustomerProfiles", ["tenantId", "document"]);
    await queryInterface.addIndex("CustomerProfiles", [
      "tenantId",
      "companyName"
    ]);
  },

  down: (queryInterface: QueryInterface) =>
    queryInterface.dropTable("CustomerProfiles")
};
