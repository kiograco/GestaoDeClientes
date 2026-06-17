import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.renameColumn(
      "monitoring_points",
      "position_x",
      "position_x_percent"
    );
    await queryInterface.renameColumn(
      "monitoring_points",
      "position_y",
      "position_y_percent"
    );

    await queryInterface.addColumn("monitoring_points", "marker_color", {
      type: DataTypes.STRING,
      allowNull: true
    });
    await queryInterface.addColumn("monitoring_points", "marker_icon_url", {
      type: DataTypes.STRING,
      allowNull: true
    });
    await queryInterface.addColumn("monitoring_points", "marker_type", {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "color"
    });

    await queryInterface.createTable("monitoring_point_map_history", {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      tenant_id: {
        type: DataTypes.INTEGER,
        references: { model: "Tenants", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
        allowNull: false
      },
      monitoring_point_id: {
        type: DataTypes.INTEGER,
        references: { model: "monitoring_points", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
        allowNull: false
      },
      floor_plan_id: {
        type: DataTypes.INTEGER,
        references: { model: "client_floor_plans", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
        allowNull: false
      },
      old_position_x_percent: {
        type: DataTypes.DECIMAL(8, 4),
        allowNull: true
      },
      old_position_y_percent: {
        type: DataTypes.DECIMAL(8, 4),
        allowNull: true
      },
      new_position_x_percent: {
        type: DataTypes.DECIMAL(8, 4),
        allowNull: true
      },
      new_position_y_percent: {
        type: DataTypes.DECIMAL(8, 4),
        allowNull: true
      },
      changed_by_user_id: {
        type: DataTypes.INTEGER,
        references: { model: "Users", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
        allowNull: true
      },
      notes: { type: DataTypes.TEXT, allowNull: true },
      created_at: { type: DataTypes.DATE, allowNull: false }
    });

    await queryInterface.addIndex("monitoring_point_map_history", [
      "tenant_id",
      "monitoring_point_id",
      "floor_plan_id"
    ]);
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.dropTable("monitoring_point_map_history");
    await queryInterface.removeColumn("monitoring_points", "marker_type");
    await queryInterface.removeColumn("monitoring_points", "marker_icon_url");
    await queryInterface.removeColumn("monitoring_points", "marker_color");
    await queryInterface.renameColumn(
      "monitoring_points",
      "position_y_percent",
      "position_y"
    );
    await queryInterface.renameColumn(
      "monitoring_points",
      "position_x_percent",
      "position_x"
    );
  }
};
