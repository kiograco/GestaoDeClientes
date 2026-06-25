import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.createTable("States", {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      ibgeCode: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true
      },
      uf: {
        type: DataTypes.STRING(2),
        allowNull: false,
        unique: true
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false
      },
      status: {
        type: DataTypes.STRING(30),
        allowNull: false,
        defaultValue: "active"
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false
      },
      deletedAt: {
        type: DataTypes.DATE,
        allowNull: true
      }
    });

    await queryInterface.createTable("Cities", {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      stateId: {
        type: DataTypes.INTEGER,
        references: { model: "States", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
        allowNull: false
      },
      ibgeCode: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false
      },
      uf: {
        type: DataTypes.STRING(2),
        allowNull: false
      },
      status: {
        type: DataTypes.STRING(30),
        allowNull: false,
        defaultValue: "active"
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false
      },
      deletedAt: {
        type: DataTypes.DATE,
        allowNull: true
      }
    });

    await queryInterface.addIndex("States", ["uf"]);
    await queryInterface.addIndex("States", ["ibgeCode"]);
    await queryInterface.addIndex("Cities", ["stateId"]);
    await queryInterface.addIndex("Cities", ["uf"]);
    await queryInterface.addIndex("Cities", ["ibgeCode"]);
    await queryInterface.addIndex("Cities", ["name"]);
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.dropTable("Cities");
    await queryInterface.dropTable("States");
  }
};
