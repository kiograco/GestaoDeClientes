import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.createTable("ServiceOrders", {
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
        onDelete: "RESTRICT",
        allowNull: false
      },
      attendantId: {
        type: DataTypes.INTEGER,
        references: { model: "ServiceAttendants", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
        allowNull: true
      },
      createdByUserId: {
        type: DataTypes.INTEGER,
        references: { model: "Users", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
        allowNull: true
      },
      title: { type: DataTypes.STRING, allowNull: false },
      description: { type: DataTypes.TEXT, allowNull: true },
      serviceType: { type: DataTypes.STRING, allowNull: false },
      priority: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "baixa"
      },
      status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "rascunho"
      },
      scheduledStart: { type: DataTypes.DATE, allowNull: true },
      scheduledEnd: { type: DataTypes.DATE, allowNull: true },
      address: { type: DataTypes.STRING, allowNull: true },
      addressComplement: { type: DataTypes.STRING, allowNull: true },
      city: { type: DataTypes.STRING, allowNull: true },
      state: { type: DataTypes.STRING(2), allowNull: true },
      zipCode: { type: DataTypes.STRING(8), allowNull: true },
      publicObservation: { type: DataTypes.TEXT, allowNull: true },
      internalObservation: { type: DataTypes.TEXT, allowNull: true },
      customerSignatureUrl: { type: DataTypes.STRING, allowNull: true },
      attachmentUrls: { type: DataTypes.JSONB, allowNull: true },
      completedAt: { type: DataTypes.DATE, allowNull: true },
      canceledAt: { type: DataTypes.DATE, allowNull: true },
      cancelReason: { type: DataTypes.TEXT, allowNull: true },
      createdAt: { type: DataTypes.DATE, allowNull: false },
      updatedAt: { type: DataTypes.DATE, allowNull: false }
    });
    await queryInterface.addIndex("ServiceOrders", ["tenantId", "status"]);
    await queryInterface.addIndex("ServiceOrders", ["tenantId", "contactId"]);
    await queryInterface.addIndex("ServiceOrders", [
      "tenantId",
      "attendantId",
      "scheduledStart",
      "scheduledEnd"
    ]);
  },

  down: (queryInterface: QueryInterface) =>
    queryInterface.dropTable("ServiceOrders")
};
