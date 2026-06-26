import { Request, Response } from "express";
import * as Yup from "yup";
import AppError from "../errors/AppError";
import * as SalesPipeline from "../services/SalesPipelineServices/SalesPipelineService";

const nullableString = Yup.string()
  .transform(value => value || null)
  .nullable();

const opportunitySchema = Yup.object().shape({
  contactId: Yup.number().integer().positive().required(),
  ownerUserId: Yup.number().integer().positive().nullable(),
  title: Yup.string().trim().required().min(2),
  description: nullableString,
  stage: Yup.string().oneOf(SalesPipeline.SALES_PIPELINE_STAGES),
  estimatedValue: Yup.number().min(0).nullable(),
  expectedCloseDate: Yup.date().nullable(),
  source: nullableString,
  lostReason: nullableString,
  notes: nullableString
});

const convertSchema = Yup.object().shape({
  attendanceTypeId: Yup.number().integer().positive().nullable(),
  serviceType: nullableString,
  scheduledStart: Yup.date().nullable(),
  scheduledEnd: Yup.date().nullable(),
  address: nullableString,
  city: nullableString,
  state: nullableString.length(2),
  publicObservation: nullableString,
  internalObservation: nullableString
});

const proposalItemSchema = Yup.object().shape({
  description: Yup.string().trim().required().min(2),
  quantity: Yup.number().integer().min(1).required(),
  unitPrice: Yup.number().min(0).required()
});

const proposalSchema = Yup.object().shape({
  attendanceTypeId: Yup.number().integer().positive().nullable(),
  title: Yup.string().trim().required().min(2),
  introduction: nullableString,
  status: Yup.string().oneOf(SalesPipeline.SALES_PROPOSAL_STATUSES),
  validUntil: Yup.date().nullable(),
  items: Yup.array().of(proposalItemSchema).min(1).required(),
  discount: Yup.number().min(0).nullable(),
  observation: nullableString
});

const followUpSchema = Yup.object().shape({
  days: Yup.number().integer().min(1).max(90).nullable(),
  message: nullableString
});

const performanceGoalSchema = Yup.object().shape({
  roleType: Yup.string().oneOf(["seller", "technician"]).required(),
  userId: Yup.number().integer().positive().nullable(),
  attendantId: Yup.number().integer().positive().nullable(),
  periodMonth: Yup.string()
    .matches(/^\d{4}-\d{2}$/)
    .required(),
  targetCount: Yup.number().integer().min(0).nullable(),
  targetValue: Yup.number().min(0).nullable(),
  active: Yup.boolean()
});

const validate = async <T>(schema: Yup.ObjectSchema, data: LegacyAny) => {
  try {
    return (await schema.validate(data, { stripUnknown: true })) as T;
  } catch (error) {
    throw new AppError(error.message);
  }
};

export const index = async (req: Request, res: Response): Promise<Response> =>
  res.json(await SalesPipeline.listOpportunities(req.user.tenantId, req.query));

export const dashboard = async (
  req: Request,
  res: Response
): Promise<Response> =>
  res.json(await SalesPipeline.getDashboard(req.user.tenantId));

export const show = async (req: Request, res: Response): Promise<Response> =>
  res.json(
    await SalesPipeline.showOpportunity(
      req.user.tenantId,
      req.params.opportunityId
    )
  );

export const store = async (req: Request, res: Response): Promise<Response> =>
  res
    .status(201)
    .json(
      await SalesPipeline.createOpportunity(
        req.user.tenantId,
        req.user.id,
        await validate<SalesPipeline.SalesOpportunityData>(
          opportunitySchema,
          req.body
        )
      )
    );

export const update = async (req: Request, res: Response): Promise<Response> =>
  res.json(
    await SalesPipeline.updateOpportunity(
      req.user.tenantId,
      req.user.id,
      req.params.opportunityId,
      await validate<SalesPipeline.SalesOpportunityData>(
        opportunitySchema,
        req.body
      )
    )
  );

export const listProposals = async (
  req: Request,
  res: Response
): Promise<Response> =>
  res.json(
    await SalesPipeline.listProposals(
      req.user.tenantId,
      req.params.opportunityId
    )
  );

export const createProposal = async (
  req: Request,
  res: Response
): Promise<Response> =>
  res
    .status(201)
    .json(
      await SalesPipeline.createProposal(
        req.user.tenantId,
        req.user.id,
        req.params.opportunityId,
        await validate<SalesPipeline.SalesProposalData>(
          proposalSchema,
          req.body
        )
      )
    );

export const updateProposal = async (
  req: Request,
  res: Response
): Promise<Response> =>
  res.json(
    await SalesPipeline.updateProposal(
      req.user.tenantId,
      req.user.id,
      req.params.proposalId,
      await validate<SalesPipeline.SalesProposalData>(proposalSchema, req.body)
    )
  );

export const listStaleOpportunities = async (
  req: Request,
  res: Response
): Promise<Response> =>
  res.json(
    await SalesPipeline.listStaleOpportunities(req.user.tenantId, req.query)
  );

export const runAutomaticFollowUps = async (
  req: Request,
  res: Response
): Promise<Response> =>
  res.json(
    await SalesPipeline.runAutomaticFollowUps(
      req.user.tenantId,
      req.user.id,
      await validate<SalesPipeline.FollowUpData>(followUpSchema, req.body)
    )
  );

export const proposalDocument = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const pdf = await SalesPipeline.generateProposalDocument(
    req.user.tenantId,
    req.params.proposalId
  );
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `inline; filename=proposta-${req.params.proposalId}.pdf`
  );
  return res.send(pdf);
};

export const portalProposal = async (
  req: Request,
  res: Response
): Promise<Response> =>
  res.json(await SalesPipeline.showPortalProposal(req.params.token));

export const approvePortalProposal = async (
  req: Request,
  res: Response
): Promise<Response> =>
  res.json(await SalesPipeline.approvePortalProposal(req.params.token));

export const portalProposalDocument = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const pdf = await SalesPipeline.generatePortalProposalDocument(
    req.params.token
  );
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", "inline; filename=proposta.pdf");
  return res.send(pdf);
};

export const portalServiceOrder = async (
  req: Request,
  res: Response
): Promise<Response> =>
  res.json(await SalesPipeline.showPortalServiceOrder(req.params.token));

export const convertProposalToServiceOrder = async (
  req: Request,
  res: Response
): Promise<Response> =>
  res
    .status(201)
    .json(
      await SalesPipeline.convertProposalToServiceOrder(
        req.user.tenantId,
        req.user.id,
        req.params.proposalId,
        await validate<SalesPipeline.ConvertOpportunityData>(
          convertSchema,
          req.body
        )
      )
    );

export const listPerformanceGoals = async (
  req: Request,
  res: Response
): Promise<Response> =>
  res.json(
    await SalesPipeline.listPerformanceGoals(req.user.tenantId, req.query)
  );

export const savePerformanceGoal = async (
  req: Request,
  res: Response
): Promise<Response> =>
  res
    .status(201)
    .json(
      await SalesPipeline.savePerformanceGoal(
        req.user.tenantId,
        await validate<SalesPipeline.PerformanceGoalData>(
          performanceGoalSchema,
          req.body
        )
      )
    );

export const performanceGoalsDashboard = async (
  req: Request,
  res: Response
): Promise<Response> =>
  res.json(
    await SalesPipeline.getPerformanceGoalsDashboard(
      req.user.tenantId,
      req.query
    )
  );

export const convertToServiceOrder = async (
  req: Request,
  res: Response
): Promise<Response> =>
  res
    .status(201)
    .json(
      await SalesPipeline.convertOpportunityToServiceOrder(
        req.user.tenantId,
        req.user.id,
        req.params.opportunityId,
        await validate<SalesPipeline.ConvertOpportunityData>(
          convertSchema,
          req.body
        )
      )
    );
