import sequelize from "../../src/database";

const preservedTables = ["SequelizeMeta"];

export const truncateDatabase = async (): Promise<void> => {
  const tables = Object.values(sequelize.models)
    .map(model => model.getTableName())
    .map(tableName =>
      typeof tableName === "string" ? tableName : tableName.tableName
    )
    .filter(tableName => !preservedTables.includes(tableName));

  if (!tables.length) return;

  await sequelize.query(
    `TRUNCATE TABLE ${tables
      .map(tableName => `"${tableName}"`)
      .join(", ")} RESTART IDENTITY CASCADE;`
  );
};
