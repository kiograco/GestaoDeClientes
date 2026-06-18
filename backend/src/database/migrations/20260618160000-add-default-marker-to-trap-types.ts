import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.addColumn("trap_types", "marker_color", {
      type: DataTypes.STRING,
      allowNull: true
    });
    await queryInterface.addColumn("trap_types", "marker_icon_url", {
      type: DataTypes.STRING,
      allowNull: true
    });
    await queryInterface.addColumn("trap_types", "marker_type", {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "color"
    });
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.removeColumn("trap_types", "marker_type");
    await queryInterface.removeColumn("trap_types", "marker_icon_url");
    await queryInterface.removeColumn("trap_types", "marker_color");
  }
};
