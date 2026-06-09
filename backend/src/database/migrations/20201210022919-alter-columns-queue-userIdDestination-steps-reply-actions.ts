import { QueryInterface, DataTypes } from "sequelize";

const tableName = "StepsReplyActions";

module.exports = {
  up: async (queryInterface: QueryInterface) => {
    const table = (await queryInterface.describeTable(tableName)) as Record<
      string,
      unknown
    >;

    if (table.queue) {
      await queryInterface.removeColumn(tableName, "queue");
    }

    if (!table.queueId) {
      await queryInterface.addColumn(tableName, "queueId", {
        type: DataTypes.INTEGER,
        references: { model: "Queues", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "restrict",
        defaultValue: null,
        allowNull: true
      });
    }

    if (table.userIdDestination) {
      await queryInterface.removeColumn(tableName, "userIdDestination");
    }

    await queryInterface.addColumn(tableName, "userIdDestination", {
      type: DataTypes.INTEGER,
      references: { model: "Users", key: "id" },
      onUpdate: "CASCADE",
      onDelete: "restrict",
      defaultValue: null,
      allowNull: true
    });
  },

  down: async (queryInterface: QueryInterface) => {
    const table = (await queryInterface.describeTable(tableName)) as Record<
      string,
      unknown
    >;

    if (table.queueId) {
      await queryInterface.removeColumn(tableName, "queueId");
    }

    if (!table.queue) {
      await queryInterface.addColumn(tableName, "queue", {
        type: DataTypes.INTEGER,
        defaultValue: null,
        allowNull: true
      });
    }

    if (table.userIdDestination) {
      await queryInterface.removeColumn(tableName, "userIdDestination");
    }

    await queryInterface.addColumn(tableName, "userIdDestination", {
      type: DataTypes.INTEGER,
      defaultValue: null,
      allowNull: true
    });
  }
};
