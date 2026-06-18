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
  acronym: nullableString,
  type: Yup.string().trim().default("monitoramento"),
  description: nullableString,
  active: Yup.boolean(),
  pestIds: Yup.array().of(Yup.number().integer().positive()).default([])
});

const catalogSchema = Yup.object().shape({
  name: Yup.string().trim().required().min(2),
  active: Yup.boolean()
});

const inspectionSchema = Yup.object().shape({
  monitoringPointId: Yup.number().integer().positive().required(),
  technicianId: Yup.number().integer().positive().nullable(),
  inspectionDate: Yup.date().nullable(),
  conditionIds: Yup.array().of(Yup.number().integer().positive()).default([]),
  actionIds: Yup.array().of(Yup.number().integer().positive()).default([]),
  notes: nullableString
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
  markerColor: nullableString,
  markerIconUrl: nullableString,
  markerType: Yup.string().oneOf(["color", "icon"]).default("color"),
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

const floorPlanSchema = Yup.object().shape({
  clientId: Yup.number().integer().positive().required(),
  addressId: Yup.number().integer().positive().required(),
  name: Yup.string().trim().required().min(2),
  notes: nullableString
});

const pointPositionSchema = Yup.object().shape({
  floorPlanId: Yup.number().integer().positive().required(),
  positionX: Yup.number().min(0).max(100).required(),
  positionY: Yup.number().min(0).max(100).required(),
  mapLabel: nullableString,
  notes: nullableString
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

export const listConditions = async (
  req: Request,
  res: Response
): Promise<Response> =>
  res.json(await Monitoring.listConditions(req.user.tenantId));

export const storeCondition = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const condition = await Monitoring.createCondition(
    req.user.tenantId,
    await validate<Monitoring.TrapCatalogData>(catalogSchema, req.body)
  );
  await auditMonitoringAction(req, "trap_condition_created", condition.id);
  return res.status(201).json(condition);
};

export const updateCondition = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const condition = await Monitoring.updateCondition(
    req.user.tenantId,
    req.params.conditionId,
    await validate<Monitoring.TrapCatalogData>(catalogSchema, req.body)
  );
  await auditMonitoringAction(req, "trap_condition_updated", condition.id);
  return res.json(condition);
};

export const listActions = async (
  req: Request,
  res: Response
): Promise<Response> =>
  res.json(await Monitoring.listActions(req.user.tenantId));

export const storeAction = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const action = await Monitoring.createAction(
    req.user.tenantId,
    await validate<Monitoring.TrapCatalogData>(catalogSchema, req.body)
  );
  await auditMonitoringAction(req, "trap_action_created", action.id);
  return res.status(201).json(action);
};

export const updateAction = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const action = await Monitoring.updateAction(
    req.user.tenantId,
    req.params.actionId,
    await validate<Monitoring.TrapCatalogData>(catalogSchema, req.body)
  );
  await auditMonitoringAction(req, "trap_action_updated", action.id);
  return res.json(action);
};

export const listInspections = async (
  req: Request,
  res: Response
): Promise<Response> =>
  res.json(
    await Monitoring.listInspections(req.user.tenantId, {
      monitoringPointId:
        typeof req.query.monitoringPointId === "string"
          ? req.query.monitoringPointId
          : undefined
    })
  );

export const storeInspection = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const inspection = await Monitoring.createInspection(
    req.user.tenantId,
    Number(req.user.id),
    await validate<Monitoring.TrapInspectionData>(inspectionSchema, req.body)
  );
  await auditMonitoringAction(req, "trap_inspection_created", inspection.id, {
    monitoringPointId: inspection.monitoringPointId
  });
  return res.status(201).json(inspection);
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

export const listFloorPlans = async (
  req: Request,
  res: Response
): Promise<Response> =>
  res.json(
    await Monitoring.listFloorPlans(req.user.tenantId, {
      clientId:
        typeof req.query.clientId === "string" ? req.query.clientId : undefined,
      addressId:
        typeof req.query.addressId === "string"
          ? req.query.addressId
          : undefined
    })
  );

export const storeFloorPlan = async (
  req: Request,
  res: Response
): Promise<Response> => {
  if (!req.file) throw new AppError("Envie PDF, JPG, PNG ou WEBP", 400);
  const payload = await validate<{
    clientId: number;
    addressId: number;
    name: string;
    notes?: string | null;
  }>(floorPlanSchema, req.body);
  const floorPlan = await Monitoring.createFloorPlan(req.user.tenantId, {
    ...payload,
    fileUrl: `/public/floor-plans/${req.file.filename}`,
    fileType: req.file.mimetype,
    originalFilename: req.file.originalname
  });
  await auditMonitoringAction(req, "floor_plan_created", floorPlan.id, {
    clientId: floorPlan.clientId,
    addressId: floorPlan.addressId
  });
  return res.status(201).json(floorPlan);
};

export const updateFloorPlan = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const floorPlan = await Monitoring.updateFloorPlan(
    req.user.tenantId,
    req.params.floorPlanId,
    await validate<Partial<Monitoring.FloorPlanData>>(
      Yup.object().shape({
        name: Yup.string().trim().required().min(2),
        notes: nullableString
      }),
      req.body
    )
  );
  await auditMonitoringAction(req, "floor_plan_updated", floorPlan.id);
  return res.json(floorPlan);
};

export const removeFloorPlan = async (
  req: Request,
  res: Response
): Promise<Response> => {
  await Monitoring.deleteFloorPlan(req.user.tenantId, req.params.floorPlanId);
  await auditMonitoringAction(
    req,
    "floor_plan_deleted",
    req.params.floorPlanId
  );
  return res.status(204).send();
};

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

export const updatePointPosition = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const point = await Monitoring.updatePointPosition(
    req.user.tenantId,
    req.params.pointId,
    await validate<Monitoring.PointPositionData>(pointPositionSchema, req.body),
    Number(req.user.id)
  );
  await auditMonitoringAction(req, "monitoring_point_positioned", point.id, {
    floorPlanId: point.floorPlanId,
    positionX: point.positionX,
    positionY: point.positionY
  });
  return res.json(point);
};

export const removePointPosition = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const point = await Monitoring.removePointPosition(
    req.user.tenantId,
    req.params.pointId,
    Number(req.user.id),
    typeof req.body?.notes === "string" ? req.body.notes : undefined
  );
  await auditMonitoringAction(
    req,
    "monitoring_point_position_removed",
    point.id,
    {
      floorPlanId: point.floorPlanId
    }
  );
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
