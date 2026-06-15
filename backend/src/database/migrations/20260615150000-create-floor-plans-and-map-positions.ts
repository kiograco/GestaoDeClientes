import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.createTable("client_floor_plans", {
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
      client_id: {
        type: DataTypes.INTEGER,
        references: { model: "clients", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
        allowNull: false
      },
      address_id: {
        type: DataTypes.INTEGER,
        references: { model: "client_addresses", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
        allowNull: false
      },
      name: { type: DataTypes.STRING, allowNull: false },
      file_url: { type: DataTypes.STRING, allowNull: false },
      file_type: { type: DataTypes.STRING, allowNull: false },
      original_filename: { type: DataTypes.STRING, allowNull: false },
      notes: { type: DataTypes.TEXT, allowNull: true },
      created_at: { type: DataTypes.DATE, allowNull: false },
      updated_at: { type: DataTypes.DATE, allowNull: false },
      deleted_at: { type: DataTypes.DATE, allowNull: true }
    });

    await queryInterface.addColumn("monitoring_points", "floor_plan_id", {
      type: DataTypes.INTEGER,
      references: { model: "client_floor_plans", key: "id" },
      onUpdate: "CASCADE",
      onDelete: "SET NULL",
      allowNull: true
    });
    await queryInterface.addColumn("monitoring_points", "position_x", {
      type: DataTypes.DECIMAL(8, 4),
      allowNull: true
    });
    await queryInterface.addColumn("monitoring_points", "position_y", {
      type: DataTypes.DECIMAL(8, 4),
      allowNull: true
    });
    await queryInterface.addColumn("monitoring_points", "map_label", {
      type: DataTypes.STRING,
      allowNull: true
    });
    await queryInterface.addColumn("monitoring_points", "is_positioned", {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    });

    await queryInterface.addIndex("client_floor_plans", [
      "tenant_id",
      "client_id",
      "address_id"
    ]);
    await queryInterface.addIndex("monitoring_points", [
      "tenant_id",
      "floor_plan_id",
      "is_positioned"
    ]);
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.removeColumn("monitoring_points", "is_positioned");
    await queryInterface.removeColumn("monitoring_points", "map_label");
    await queryInterface.removeColumn("monitoring_points", "position_y");
    await queryInterface.removeColumn("monitoring_points", "position_x");
    await queryInterface.removeColumn("monitoring_points", "floor_plan_id");
    await queryInterface.dropTable("client_floor_plans");
  }
};
