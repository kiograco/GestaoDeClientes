import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.addColumn("clients", "contact_id", {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: "Contacts", key: "id" },
      onUpdate: "CASCADE",
      onDelete: "SET NULL"
    });

    await queryInterface.addIndex("clients", ["tenant_id", "contact_id"]);
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.removeIndex("clients", ["tenant_id", "contact_id"]);
    await queryInterface.removeColumn("clients", "contact_id");
  }
};
