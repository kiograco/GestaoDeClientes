import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.addColumn("Whatsapps", "instagramOAuthUserId", {
      type: DataTypes.STRING,
      allowNull: true
    });
    await queryInterface.addColumn("Whatsapps", "instagramOAuthToken", {
      type: DataTypes.TEXT,
      allowNull: true
    });
    await queryInterface.addColumn("Whatsapps", "instagramOAuthExpiresAt", {
      type: DataTypes.DATE,
      allowNull: true
    });
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.removeColumn("Whatsapps", "instagramOAuthExpiresAt");
    await queryInterface.removeColumn("Whatsapps", "instagramOAuthToken");
    await queryInterface.removeColumn("Whatsapps", "instagramOAuthUserId");
  }
};
