require("../app/config-env");

const numberEnv = (name, fallback) => {
  const value = Number(process.env[name]);
  return Number.isInteger(value) ? value : fallback;
};

module.exports = {
  pool: {
    max: numberEnv("POSTGRES_POOL_MAX", 20),
    min: numberEnv("POSTGRES_POOL_MIN", 2),
    acquire: numberEnv("POSTGRES_POOL_ACQUIRE", 30000),
    idle: numberEnv("POSTGRES_POOL_IDLE", 10000)
  },
  dialect: process.env.DB_DIALECT || "postgres",
  timezone: "UTC",
  host: process.env.POSTGRES_HOST || "localhost",
  port: numberEnv("DB_PORT", 5432),
  database: process.env.POSTGRES_DB || "wchats",
  username: process.env.POSTGRES_USER || "postgres",
  password: process.env.POSTGRES_PASSWORD,
  logging: false
};
