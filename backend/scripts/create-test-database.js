const dotenv = require("dotenv");

dotenv.config({
  path: process.env.NODE_ENV === "test" ? ".env.test" : ".env"
});

const { Client } = require("pg");

const database = process.env.POSTGRES_DB || "wchats_test";
const username = process.env.POSTGRES_USER || "postgres";
const password = process.env.POSTGRES_PASSWORD || "postgres";
const host = process.env.POSTGRES_HOST || "localhost";
const port = Number(process.env.DB_PORT || 5432);

const quoteIdentifier = value => `"${String(value).replace(/"/g, '""')}"`;

async function main() {
  const maintenanceDatabases = [
    process.env.POSTGRES_MAINTENANCE_DB || "postgres",
    "template1"
  ];
  let client;

  for (const maintenanceDatabase of maintenanceDatabases) {
    client = new Client({
      host,
      port,
      database: maintenanceDatabase,
      user: username,
      password
    });

    try {
      await client.connect();
      break;
    } catch (error) {
      await client.end().catch(() => undefined);
      client = undefined;
      if (maintenanceDatabase === maintenanceDatabases[maintenanceDatabases.length - 1]) {
        throw error;
      }
    }
  }

  const result = await client.query(
    "SELECT 1 FROM pg_database WHERE datname = $1",
    [database]
  );

  if (!result.rowCount) {
    await client.query(`CREATE DATABASE ${quoteIdentifier(database)}`);
    console.info(`Created test database "${database}".`);
  } else {
    console.info(`Test database "${database}" already exists.`);
  }

  await client.end();
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
