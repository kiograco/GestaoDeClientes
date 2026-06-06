import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.createTable("ServiceOrderLogs", {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      serviceOrderId: {
        type: DataTypes.INTEGER,
        references: { model: "ServiceOrders", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
        allowNull: false
      },
      userId: {
        type: DataTypes.INTEGER,
        references: { model: "Users", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
        allowNull: true
      },
      action: { type: DataTypes.STRING, allowNull: false },
      oldValue: { type: DataTypes.JSONB, allowNull: true },
      newValue: { type: DataTypes.JSONB, allowNull: true },
      description: { type: DataTypes.TEXT, allowNull: true },
      createdAt: { type: DataTypes.DATE, allowNull: false },
      updatedAt: { type: DataTypes.DATE, allowNull: false }
    });
    await queryInterface.addIndex("ServiceOrderLogs", ["serviceOrderId"]);
    await queryInterface.addIndex("ServiceOrderLogs", ["userId"]);
  },

  down: (queryInterface: QueryInterface) =>
    queryInterface.dropTable("ServiceOrderLogs")
};
