import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: (queryInterface: QueryInterface) =>
    queryInterface.changeColumn("Products", "imageUrl", {
      type: DataTypes.TEXT,
      allowNull: true
    }),

  down: (queryInterface: QueryInterface) =>
    queryInterface.changeColumn("Products", "imageUrl", {
      type: DataTypes.STRING,
      allowNull: true
    })
};
