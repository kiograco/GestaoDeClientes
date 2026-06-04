import sequelize from "../../src/database";
import { truncateDatabase } from "../helpers/database";

beforeAll(async () => {
  await sequelize.authenticate();
});

afterEach(async () => {
  await truncateDatabase();
});

afterAll(async () => {
  await sequelize.close();
});
