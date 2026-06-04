require("ts-node/register");

const sequelize = require("../src/database").default;
const PrivacyRetentionService =
  require("../src/services/PrivacyRetentionService").default;

(async () => {
  try {
    await sequelize.authenticate();
    const result = await PrivacyRetentionService();
    console.log(JSON.stringify(result));
  } finally {
    await sequelize.close();
  }
})().catch(error => {
  console.error(error);
  process.exit(1);
});
