import { Request, Response } from "express";
import * as Yup from "yup";
import AppError from "../errors/AppError";
import { can } from "../helpers/permissions";
import createAuditLog, { listAuditLogs } from "../services/AuditLogService";
import { ExportFormat } from "../services/BaseRegisterServices/BaseRegisterExportService";
import * as AttendanceTypeService from "../services/AttendanceTypeService";

const nullableString = Yup.string()
  .transform(value => value || null)
  .nullable();

const schema = Yup.object().shape({
  name: Yup.string().trim().required().min(2).max(255),
  description: nullableString,
  isActive: Yup.boolean().default(true)
});

const ensure = (profile: string, permission: string): void => {
  if (!can(profile, permission)) throw new AppError("ERR_NO_PERMISSION", 403);
};

const validate = async <T>(validator: Yup.ObjectSchema, data: LegacyAny) => {
  try {
    return (await validator.validate(data, { stripUnknown: true })) as T;
  } catch (error) {
    throw new AppError(error.message, 400);
  }
};

const audit = (
  req: Request,
  action: string,
  resourceId?: string | number | null,
  metadata?: Record<string, unknown>
) =>
  createAuditLog({
    tenantId: req.user.tenantId,
    userId: req.user.id,
    action,
    resource: "attendance_type",
    resourceId,
    ip: req.ip,
    userAgent: req.get("user-agent"),
    metadata
  });

const exportFormat = (format?: unknown): ExportFormat => {
  const value = String(format || "csv").toLowerCase();
  if (!["csv", "xlsx", "pdf"].includes(value)) {
    throw new AppError("ERR_INVALID_EXPORT_FORMAT", 400);
  }
  return value as ExportFormat;
};

export const index = async (req: Request, res: Response): Promise<Response> => {
  ensure(req.user.profile, "attendance-types:view");
  return res.json(
    await AttendanceTypeService.list(req.user.tenantId, req.query)
  );
};

export const show = async (req: Request, res: Response): Promise<Response> => {
  ensure(req.user.profile, "attendance-types:view");
  return res.json(
    await AttendanceTypeService.show(req.user.tenantId, req.params.id)
  );
};

export const store = async (req: Request, res: Response): Promise<Response> => {
  ensure(req.user.profile, "attendance-types:create");
  const data = await validate<AttendanceTypeService.AttendanceTypeData>(
    schema,
    req.body
  );
  const attendanceType = await AttendanceTypeService.create(
    req.user.tenantId,
    data
  );
  await audit(req, "attendance_type_created", attendanceType.id, {
    name: attendanceType.name
  });
  return res.status(201).json(attendanceType);
};

export const update = async (
  req: Request,
  res: Response
): Promise<Response> => {
  ensure(req.user.profile, "attendance-types:edit");
  const data = await validate<AttendanceTypeService.AttendanceTypeData>(
    schema,
    req.body
  );
  const attendanceType = await AttendanceTypeService.update(
    req.user.tenantId,
    req.params.id,
    data
  );
  await audit(req, "attendance_type_updated", attendanceType.id, {
    name: attendanceType.name
  });
  return res.json(attendanceType);
};

export const toggleActive = async (
  req: Request,
  res: Response
): Promise<Response> => {
  ensure(req.user.profile, "attendance-types:edit");
  const payload = await validate<{ isActive: boolean }>(
    Yup.object().shape({ isActive: Yup.boolean().required() }),
    req.body
  );
  const attendanceType = await AttendanceTypeService.setActive(
    req.user.tenantId,
    req.params.id,
    payload.isActive
  );
  await audit(
    req,
    payload.isActive
      ? "attendance_type_reactivated"
      : "attendance_type_inactivated",
    attendanceType.id,
    { name: attendanceType.name }
  );
  return res.json(attendanceType);
};

export const remove = async (
  req: Request,
  res: Response
): Promise<Response> => {
  ensure(req.user.profile, "attendance-types:delete");
  const result = await AttendanceTypeService.remove(
    req.user.tenantId,
    req.params.id
  );
  await audit(
    req,
    result === "deleted"
      ? "attendance_type_deleted"
      : "attendance_type_delete_blocked_inactivated",
    req.params.id
  );
  return result === "deleted"
    ? res.status(204).send()
    : res.status(200).json({ deleted: false, inactivated: true });
};

export const exportRows = async (
  req: Request,
  res: Response
): Promise<Response> => {
  ensure(req.user.profile, "attendance-types:export");
  const exported = await AttendanceTypeService.exportAttendanceTypes(
    req.user.tenantId,
    req.query,
    exportFormat(req.query.format)
  );
  res.setHeader("Content-Type", exported.contentType);
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${exported.fileName}"`
  );
  return res.send(exported.buffer);
};

export const auditLogs = async (
  req: Request,
  res: Response
): Promise<Response> => {
  ensure(req.user.profile, "attendance-types:view");
  return res.json(
    await listAuditLogs({
      tenantId: req.user.tenantId,
      resource: "attendance_type",
      limit: Number(req.query.limit) || 100
    })
  );
};
