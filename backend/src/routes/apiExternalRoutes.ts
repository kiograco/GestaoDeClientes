import express from "express";
import multer from "multer";
import isAPIAuth from "../middleware/isAPIAuth";
import uploadConfig from "../config/upload";
import rateLimit from "../middleware/rateLimit";

import * as APIExternalController from "../controllers/APIExternalController";

const apiExternalRoute = express.Router();

const upload = multer({
  ...uploadConfig,
  limits: {
    files: 1, // allow only 1 file per request
    fileSize: 1024 * 1024 * 5 // 5 MB (max file size)
  }

  // fileFilter: (req, file, cb) => {
  //   console.log(file);
  //   console.log(req);
  //   console.log(cb);
  // }
});
const externalApiRateLimit = rateLimit({ windowMs: 60 * 1000, max: 120 });

apiExternalRoute.post(
  "/v1/api/external/:apiId",
  externalApiRateLimit,
  isAPIAuth,
  upload.single("media"),
  APIExternalController.sendMessageAPI
);

apiExternalRoute.post(
  "/v1/api/external/:apiId/start-session",
  externalApiRateLimit,
  isAPIAuth,
  APIExternalController.startSession
);

export default apiExternalRoute;
