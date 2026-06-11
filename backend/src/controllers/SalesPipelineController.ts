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
  serviceType: nullableString,
  scheduledStart: Yup.date().nullable(),
  scheduledEnd: Yup.date().nullable(),
  address: nullableString,
  city: nullableString,
  state: nullableString.length(2),
  publicObservation: nullableString,
  internalObservation: nullableString
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
