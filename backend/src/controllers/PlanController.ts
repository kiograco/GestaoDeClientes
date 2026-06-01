import { Request, Response } from "express";
import * as Yup from "yup";
import AppError from "../errors/AppError";
import Plan from "../models/Plan";

const planSchema = Yup.object().shape({
  name: Yup.string().trim().required().min(2),
  price: Yup.number().positive().required(),
  durationDays: Yup.number().integer().positive().required(),
  limits: Yup.object().required(),
  isActive: Yup.boolean()
});

export const index = async (
  _req: Request,
  res: Response
): Promise<Response> => {
  const plans = await Plan.findAll({ order: [["durationDays", "ASC"]] });
  return res.json(plans);
};

export const store = async (req: Request, res: Response): Promise<Response> => {
  try {
    await planSchema.validate(req.body);
  } catch (error) {
    throw new AppError(error.message);
  }

  const plan = await Plan.create(req.body);
  return res.status(201).json(plan);
};

export const update = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const plan = await Plan.findByPk(req.params.planId);
  if (!plan) throw new AppError("ERR_NO_PLAN_FOUND", 404);

  try {
    await planSchema.validate({ ...plan.toJSON(), ...req.body });
  } catch (error) {
    throw new AppError(error.message);
  }

  await plan.update(req.body);
  return res.json(plan);
};
