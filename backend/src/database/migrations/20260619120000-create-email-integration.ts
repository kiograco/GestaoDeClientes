import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.addColumn("Tenants", "mailSettings", {
      type: DataTypes.JSONB,
      allowNull: true
    });
    await queryInterface.createTable("email_logs", {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      tenant_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: "Tenants", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE"
      },
      recipient: { type: DataTypes.STRING, allowNull: false },
      subject: { type: DataTypes.STRING, allowNull: false },
      template: { type: DataTypes.STRING, allowNull: false },
      provider: { type: DataTypes.STRING, allowNull: false },
      status: { type: DataTypes.STRING, allowNull: false },
      provider_message_id: { type: DataTypes.STRING, allowNull: true },
      error_message: { type: DataTypes.TEXT, allowNull: true },
      created_at: { type: DataTypes.DATE, allowNull: false }
    });
    await queryInterface.addIndex("email_logs", ["tenant_id", "created_at"]);
    await queryInterface.addIndex("email_logs", ["status", "created_at"]);
  },

  down: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.dropTable("email_logs");
    await queryInterface.removeColumn("Tenants", "mailSettings");
  }
};
