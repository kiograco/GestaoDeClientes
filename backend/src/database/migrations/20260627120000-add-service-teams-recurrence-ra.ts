import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.createTable("ServiceTeams", {
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
      name: { type: DataTypes.STRING, allowNull: false },
      code: { type: DataTypes.STRING, allowNull: true },
      responsibleId: {
        type: DataTypes.INTEGER,
        references: { model: "ServiceAttendants", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
        allowNull: true
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      createdAt: { type: DataTypes.DATE, allowNull: false },
      updatedAt: { type: DataTypes.DATE, allowNull: false },
      deletedAt: { type: DataTypes.DATE, allowNull: true }
    });

    await queryInterface.createTable("ServiceTeamAttendants", {
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
      serviceTeamId: {
        type: DataTypes.INTEGER,
        references: { model: "ServiceTeams", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
        allowNull: false
      },
      serviceAttendantId: {
        type: DataTypes.INTEGER,
        references: { model: "ServiceAttendants", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
        allowNull: false
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      createdAt: { type: DataTypes.DATE, allowNull: false },
      updatedAt: { type: DataTypes.DATE, allowNull: false },
      deletedAt: { type: DataTypes.DATE, allowNull: true }
    });

    await queryInterface.addColumn("ServiceOrders", "serviceTeamId", {
      type: DataTypes.INTEGER,
      references: { model: "ServiceTeams", key: "id" },
      onUpdate: "CASCADE",
      onDelete: "SET NULL",
      allowNull: true
    });
    await queryInterface.addColumn("ServiceOrders", "recurrenceParentId", {
      type: DataTypes.INTEGER,
      references: { model: "ServiceOrders", key: "id" },
      onUpdate: "CASCADE",
      onDelete: "SET NULL",
      allowNull: true
    });
    await queryInterface.addColumn("ServiceOrders", "recurrenceEndDate", {
      type: DataTypes.DATE,
      allowNull: true
    });
    await queryInterface.addColumn(
      "ServiceOrders",
      "recurrenceMaxOccurrences",
      {
        type: DataTypes.INTEGER,
        allowNull: true
      }
    );
    await queryInterface.addColumn("ServiceOrders", "recurrenceWeekdays", {
      type: DataTypes.JSONB,
      allowNull: true
    });
    await queryInterface.addColumn("ServiceOrders", "occurrenceNumber", {
      type: DataTypes.INTEGER,
      allowNull: true
    });
    await queryInterface.addColumn("ServiceOrders", "isRaService", {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    });
    await queryInterface.addColumn(
      "ServiceOrderOccurrenceExceptions",
      "serviceTeamId",
      {
        type: DataTypes.INTEGER,
        references: { model: "ServiceTeams", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
        allowNull: true
      }
    );

    await queryInterface.createTable("ServiceRas", {
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
      clientUnitId: {
        type: DataTypes.INTEGER,
        references: { model: "ClientUnits", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
        allowNull: true
      },
      serviceOrderId: {
        type: DataTypes.INTEGER,
        references: { model: "ServiceOrders", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
        allowNull: true
      },
      attendantId: {
        type: DataTypes.INTEGER,
        references: { model: "ServiceAttendants", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
        allowNull: true
      },
      serviceTeamId: {
        type: DataTypes.INTEGER,
        references: { model: "ServiceTeams", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
        allowNull: true
      },
      status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "pending_definition"
      },
      observations: { type: DataTypes.TEXT, allowNull: true },
      createdAt: { type: DataTypes.DATE, allowNull: false },
      updatedAt: { type: DataTypes.DATE, allowNull: false },
      deletedAt: { type: DataTypes.DATE, allowNull: true }
    });

    await queryInterface.addIndex("ServiceTeams", ["tenantId", "isActive"]);
    await queryInterface.addIndex(
      "ServiceTeamAttendants",
      ["tenantId", "serviceTeamId", "serviceAttendantId"],
      { unique: true, name: "service_team_attendant_unique" }
    );
    await queryInterface.addIndex("ServiceOrders", [
      "tenantId",
      "serviceTeamId",
      "scheduledStart",
      "scheduledEnd"
    ]);
    await queryInterface.addIndex("ServiceOrderOccurrenceExceptions", [
      "tenantId",
      "serviceTeamId",
      "scheduledStart",
      "scheduledEnd"
    ]);
    await queryInterface.addIndex(
      "ServiceOrders",
      ["tenantId", "recurrenceParentId", "occurrenceNumber"],
      {
        unique: true,
        name: "service_order_recurrence_occurrence_unique"
      }
    );
    await queryInterface.addIndex("ServiceRas", ["tenantId", "status"]);
    await queryInterface.addIndex("ServiceRas", ["tenantId", "serviceOrderId"]);
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.dropTable("ServiceRas");
    await queryInterface.removeIndex(
      "ServiceOrders",
      "service_order_recurrence_occurrence_unique"
    );
    await queryInterface.removeIndex("ServiceOrders", [
      "tenantId",
      "serviceTeamId",
      "scheduledStart",
      "scheduledEnd"
    ]);
    await queryInterface.removeIndex(
      "ServiceTeamAttendants",
      "service_team_attendant_unique"
    );
    await queryInterface.removeIndex("ServiceTeams", ["tenantId", "isActive"]);
    await queryInterface.removeColumn("ServiceOrders", "isRaService");
    await queryInterface.removeIndex("ServiceOrderOccurrenceExceptions", [
      "tenantId",
      "serviceTeamId",
      "scheduledStart",
      "scheduledEnd"
    ]);
    await queryInterface.removeColumn(
      "ServiceOrderOccurrenceExceptions",
      "serviceTeamId"
    );
    await queryInterface.removeColumn("ServiceOrders", "occurrenceNumber");
    await queryInterface.removeColumn("ServiceOrders", "recurrenceWeekdays");
    await queryInterface.removeColumn(
      "ServiceOrders",
      "recurrenceMaxOccurrences"
    );
    await queryInterface.removeColumn("ServiceOrders", "recurrenceEndDate");
    await queryInterface.removeColumn("ServiceOrders", "recurrenceParentId");
    await queryInterface.removeColumn("ServiceOrders", "serviceTeamId");
    await queryInterface.dropTable("ServiceTeamAttendants");
    await queryInterface.dropTable("ServiceTeams");
  }
};
