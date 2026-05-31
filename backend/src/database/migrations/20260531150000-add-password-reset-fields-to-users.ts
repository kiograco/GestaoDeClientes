import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: (queryInterface: QueryInterface) => {
    return Promise.all([
      queryInterface.addColumn("Users", "passwordResetTokenHash", {
        type: DataTypes.STRING,
        allowNull: true
      }),
      queryInterface.addColumn("Users", "passwordResetExpires", {
        type: DataTypes.DATE,
        allowNull: true
      })
    ]);
  },

  down: (queryInterface: QueryInterface) => {
    return Promise.all([
      queryInterface.removeColumn("Users", "passwordResetTokenHash"),
      queryInterface.removeColumn("Users", "passwordResetExpires")
    ]);
  }
};
