import express from "express";
import expressSetup from "../../src/app/express";
import modules from "../../src/app/modules";

export const makeTestApp = async () => {
  const app = express();

  await expressSetup(app);
  await modules(app);

  return app;
};
