import express from "express";
import isAuth from "../middleware/isAuth";
import * as SalesPipelineController from "../controllers/SalesPipelineController";

const salesPipelineRoutes = express.Router();

salesPipelineRoutes.get(
  "/sales/pipeline",
  isAuth,
  SalesPipelineController.index
);
salesPipelineRoutes.get(
  "/sales/pipeline-dashboard",
  isAuth,
  SalesPipelineController.dashboard
);
salesPipelineRoutes.get(
  "/sales/proposals/:proposalId/document",
  isAuth,
  SalesPipelineController.proposalDocument
);
salesPipelineRoutes.put(
  "/sales/proposals/:proposalId",
  isAuth,
  SalesPipelineController.updateProposal
);
salesPipelineRoutes.post(
  "/sales/proposals/:proposalId/convert-service-order",
  isAuth,
  SalesPipelineController.convertProposalToServiceOrder
);
salesPipelineRoutes.get(
  "/sales/pipeline/:opportunityId/proposals",
  isAuth,
  SalesPipelineController.listProposals
);
salesPipelineRoutes.post(
  "/sales/pipeline/:opportunityId/proposals",
  isAuth,
  SalesPipelineController.createProposal
);
salesPipelineRoutes.get(
  "/sales/pipeline/:opportunityId",
  isAuth,
  SalesPipelineController.show
);
salesPipelineRoutes.post(
  "/sales/pipeline",
  isAuth,
  SalesPipelineController.store
);
salesPipelineRoutes.put(
  "/sales/pipeline/:opportunityId",
  isAuth,
  SalesPipelineController.update
);
salesPipelineRoutes.post(
  "/sales/pipeline/:opportunityId/convert-service-order",
  isAuth,
  SalesPipelineController.convertToServiceOrder
);

export default salesPipelineRoutes;
