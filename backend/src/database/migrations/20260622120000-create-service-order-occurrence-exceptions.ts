import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.createTable("ServiceOrderOccurrenceExceptions", {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      tenantId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: "Tenants", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE"
      },
      serviceOrderId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: "ServiceOrders", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE"
      },
      occurrenceStart: { type: DataTypes.DATE, allowNull: false },
      scheduledStart: { type: DataTypes.DATE, allowNull: false },
      scheduledEnd: { type: DataTypes.DATE, allowNull: false },
      attendantId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: "ServiceAttendants", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "SET NULL"
      },
      status: { type: DataTypes.STRING, allowNull: false },
      createdByUserId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: "Users", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT"
      },
      createdAt: { type: DataTypes.DATE, allowNull: false },
      updatedAt: { type: DataTypes.DATE, allowNull: false }
    });
    await queryInterface.addIndex(
      "ServiceOrderOccurrenceExceptions",
      ["tenantId", "serviceOrderId", "occurrenceStart"],
      { unique: true, name: "service_order_occurrence_unique" }
    );
    await queryInterface.addIndex(
      "ServiceOrderOccurrenceExceptions",
      ["tenantId", "scheduledStart", "scheduledEnd"],
      { name: "service_order_occurrence_schedule" }
    );
  },

  down: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.dropTable("ServiceOrderOccurrenceExceptions");
  }
};
