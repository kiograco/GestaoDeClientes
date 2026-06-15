import { Request, Response } from "express";
import * as Yup from "yup";
import AppError from "../errors/AppError";
import createAuditLog from "../services/AuditLogService";
import * as Monitoring from "../services/MonitoringServices/MonitoringService";

const nullableString = Yup.string()
  .transform(value => value || null)
  .nullable();

const trapTypeSchema = Yup.object().shape({
  name: Yup.string().trim().required().min(2),
  code: Yup.string().trim().required().min(2),
  type: Yup.string().trim().required().min(2),
  description: nullableString,
  active: Yup.boolean()
});

const pointCreateSchema = Yup.object().shape({
  clientId: Yup.number().integer().positive().required(),
  addressId: Yup.number().integer().positive().required(),
  areaId: Yup.number().integer().positive().required(),
  sectorId: Yup.number().integer().positive().required(),
  trapTypeId: Yup.number().integer().positive().required(),
  owner: Yup.string().oneOf(["client", "company"]).required(),
  installedAt: Yup.date().required(),
  initialNumber: Yup.number().integer().min(1).required(),
  finalNumber: Yup.number().integer().min(1).required(),
  notes: nullableString
});

const pointUpdateSchema = Yup.object().shape({
  addressId: Yup.number().integer().positive(),
  areaId: Yup.number().integer().positive(),
  sectorId: Yup.number().integer().positive(),
  trapTypeId: Yup.number().integer().positive(),
  owner: Yup.string().oneOf(["client", "company"]),
  installedAt: Yup.date(),
  pointNumber: Yup.number().integer().min(1),
  label: nullableString,
  notes: nullableString,
  active: Yup.boolean(),
  historyAction: Yup.string().oneOf([
    "installation",
    "replacement",
    "removal",
    "sector_change",
    "area_change"
  ]),
  historyNotes: nullableString
});

const validate = async <T>(
  schema: Yup.ObjectSchema<LegacyAny>,
  data: LegacyAny
): Promise<T> => {
  try {
    return (await schema.validate(data, { stripUnknown: true })) as T;
  } catch (error) {
    throw new AppError(error.message);
  }
};

const auditMonitoringAction = (
  req: Request,
  action: string,
  resourceId: string | number,
  metadata?: Record<string, unknown>
) =>
  createAuditLog({
    tenantId: req.user.tenantId,
    userId: req.user.id,
    action,
    resource: "monitoring",
    resourceId,
    ip: req.ip,
    userAgent: req.get("user-agent"),
    metadata
  });

export const listTrapTypes = async (
  req: Request,
  res: Response
): Promise<Response> =>
  res.json(await Monitoring.listTrapTypes(req.user.tenantId));

export const storeTrapType = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const trapType = await Monitoring.createTrapType(
    req.user.tenantId,
    await validate<Monitoring.TrapTypeData>(trapTypeSchema, req.body)
  );
  await auditMonitoringAction(req, "trap_type_created", trapType.id, {
    code: trapType.code
  });
  return res.status(201).json(trapType);
};

export const updateTrapType = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const trapType = await Monitoring.updateTrapType(
    req.user.tenantId,
    req.params.trapTypeId,
    await validate<Monitoring.TrapTypeData>(trapTypeSchema, req.body)
  );
  await auditMonitoringAction(req, "trap_type_updated", trapType.id, {
    code: trapType.code
  });
  return res.json(trapType);
};

export const removeTrapType = async (
  req: Request,
  res: Response
): Promise<Response> => {
  await Monitoring.deleteTrapType(req.user.tenantId, req.params.trapTypeId);
  await auditMonitoringAction(req, "trap_type_deleted", req.params.trapTypeId);
  return res.status(204).send();
};

export const listPoints = async (
  req: Request,
  res: Response
): Promise<Response> =>
  res.json(
    await Monitoring.listPoints(req.user.tenantId, {
      clientId:
        typeof req.query.clientId === "string" ? req.query.clientId : undefined,
      addressId:
        typeof req.query.addressId === "string"
          ? req.query.addressId
          : undefined,
      areaId:
        typeof req.query.areaId === "string" ? req.query.areaId : undefined,
      sectorId:
        typeof req.query.sectorId === "string" ? req.query.sectorId : undefined
    })
  );

export const storePoints = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const points = await Monitoring.createPoints(
    req.user.tenantId,
    await validate<Monitoring.MonitoringPointData>(pointCreateSchema, req.body)
  );
  await auditMonitoringAction(req, "monitoring_points_created", "batch", {
    total: points.length,
    clientId: points[0]?.clientId
  });
  return res.status(201).json(points);
};

export const updatePoint = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const point = await Monitoring.updatePoint(
    req.user.tenantId,
    req.params.pointId,
    await validate<Monitoring.MonitoringPointUpdateData>(
      pointUpdateSchema,
      req.body
    )
  );
  await auditMonitoringAction(req, "monitoring_point_updated", point.id, {
    action: req.body.historyAction || null
  });
  return res.json(point);
};

export const removePoint = async (
  req: Request,
  res: Response
): Promise<Response> => {
  await Monitoring.removePoint(
    req.user.tenantId,
    req.params.pointId,
    typeof req.body?.notes === "string" ? req.body.notes : undefined
  );
  await auditMonitoringAction(
    req,
    "monitoring_point_deleted",
    req.params.pointId
  );
  return res.status(204).send();
};
