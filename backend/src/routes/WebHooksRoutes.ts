import express from "express";
// import isAuth from "../middleware/isAuth";

import * as HooksController from "../controllers/WebHooksController";

const webHooksRoutes = express.Router();

webHooksRoutes.get(
  "/wabahooks/meta/:token",
  HooksController.CheckServiceWabaMeta
);

webHooksRoutes.post(
  "/wabahooks/meta/:token",
  HooksController.ReceivedRequestWabaMeta
);

export default webHooksRoutes;
