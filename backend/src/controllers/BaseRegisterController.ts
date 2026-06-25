import { Request, Response } from "express";
import * as Yup from "yup";
import AppError from "../errors/AppError";
import createAuditLog, { listAuditLogs } from "../services/AuditLogService";
import {
  exportRows,
  ExportColumn,
  ExportFormat
} from "../services/BaseRegisterServices/BaseRegisterExportService";
import * as BaseRegisterService from "../services/BaseRegisterServices/BaseRegisterService";
import * as ClientUnitService from "../services/BaseRegisterServices/ClientUnitService";
import * as StateCityService from "../services/BaseRegisterServices/StateCityService";

const MANAGER_PROFILES = ["admin", "supervisor", "superadmin"];

const nullableString = Yup.string()
  .transform(value => value || null)
  .nullable();

const baseRegisterSchema = Yup.object().shape({
  code: nullableString,
  name: Yup.string().trim().required().min(2),
  description: nullableString,
  status: Yup.string().oneOf(["active", "inactive"]).default("active"),
  data: Yup.object().nullable().default({})
});

const clientUnitSchema = Yup.object().shape({
  clientId: Yup.number().integer().positive().required(),
  code: nullableString,
  name: Yup.string().trim().required().min(2),
  responsibleName: nullableString,
  phone: nullableString.transform(value =>
    value ? value.replace(/\D/g, "") : value
  ),
  email: nullableString.email(),
  zipCode: nullableString.transform(value =>
    value ? value.replace(/\D/g, "") : value
  ),
  street: nullableString,
  number: nullableString,
  complement: nullableString,
  neighborhood: nullableString,
  city: nullableString,
  state: nullableString.length(2),
  latitude: Yup.number().nullable(),
  longitude: Yup.number().nullable(),
  status: Yup.string().oneOf(["active", "inactive"]).default("active"),
  observations: nullableString
});

const validate = async <T>(schema: Yup.ObjectSchema, data: LegacyAny) => {
  try {
    return (await schema.validate(data, { stripUnknown: true })) as T;
  } catch (error) {
    throw new AppError(error.message);
  }
};

const ensureCanManage = (profile: string): void => {
  if (!MANAGER_PROFILES.includes(profile)) {
    throw new AppError("ERR_BASE_REGISTER_PERMISSION_DENIED", 403);
  }
};

const ensureCanExport = (profile: string): void => {
  if (!MANAGER_PROFILES.includes(profile)) {
    throw new AppError("ERR_BASE_REGISTER_EXPORT_PERMISSION_DENIED", 403);
  }
};

const isStateModule = (module: string): boolean => module === "states";
const isCityModule = (module: string): boolean => module === "cities";

const baseRegisterToStateData = (
  data: BaseRegisterService.BaseRegisterData
): StateCityService.StateData => {
  const payload = data.data || {};
  const ibgeCode = Number(payload.ibgeCode || data.code);
  const uf = String(data.code || payload.uf || "").toUpperCase();
  if (!ibgeCode || !uf || !data.name) {
    throw new AppError("ERR_INVALID_STATE_DATA", 400);
  }
  return {
    ibgeCode,
    uf,
    name: data.name,
    status: data.status || "active"
  };
};

const baseRegisterToCityData = (
  data: BaseRegisterService.BaseRegisterData
): StateCityService.CityData => {
  const payload = data.data || {};
  const ibgeCode = Number(payload.ibgeCode || data.code);
  const stateId = Number(payload.stateId);
  if (!ibgeCode || !stateId || !data.name) {
    throw new AppError("ERR_INVALID_CITY_DATA", 400);
  }
  return {
    ibgeCode,
    stateId,
    name: data.name,
    status: data.status || "active"
  };
};

const getExportFormat = (format?: unknown): ExportFormat => {
  const requested = String(format || "csv").toLowerCase();
  if (!["csv", "xlsx", "pdf"].includes(requested)) {
    throw new AppError("ERR_INVALID_EXPORT_FORMAT", 400);
  }
  return requested as ExportFormat;
};

const sendExport = async (
  res: Response,
  rows: Record<string, unknown>[],
  columns: ExportColumn[],
  format: ExportFormat,
  fileName: string
): Promise<Response> => {
  const exported = await exportRows(rows, columns, format, fileName);
  res.setHeader("Content-Type", exported.contentType);
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${exported.fileName}"`
  );
  return res.send(exported.buffer);
};

const auditAction = async (
  req: Request,
  action: string,
  resource: string,
  resourceId?: string | number | null,
  metadata?: Record<string, unknown>
): Promise<void> =>
  createAuditLog({
    tenantId: req.user.tenantId,
    userId: req.user.id,
    action,
    resource,
    resourceId,
    ip: req.ip,
    userAgent: req.get("user-agent"),
    metadata
  });

export const listBaseRegisters = async (
  req: Request,
  res: Response
): Promise<Response> => {
  ensureCanManage(req.user.profile);
  if (isStateModule(req.params.module)) {
    return res.json(await StateCityService.listStates(req.query));
  }
  if (isCityModule(req.params.module)) {
    return res.json(await StateCityService.listCities(req.query));
  }
  return res.json(
    await BaseRegisterService.list(
      req.user.tenantId,
      req.params.module,
      req.query
    )
  );
};

export const createBaseRegister = async (
  req: Request,
  res: Response
): Promise<Response> => {
  ensureCanManage(req.user.profile);
  const data = await validate<BaseRegisterService.BaseRegisterData>(
    baseRegisterSchema,
    req.body
  );
  if (isStateModule(req.params.module)) {
    const state = await StateCityService.createState(
      baseRegisterToStateData(data)
    );
    await auditAction(req, "state_created", "state", state.id, {
      uf: state.uf,
      name: state.name
    });
    return res.status(201).json(state);
  }
  if (isCityModule(req.params.module)) {
    const city = await StateCityService.createCity(
      baseRegisterToCityData(data)
    );
    await auditAction(req, "city_created", "city", city.id, {
      stateId: city.stateId,
      name: city.name
    });
    return res.status(201).json(city);
  }
  const register = await BaseRegisterService.create(
    req.user.tenantId,
    req.params.module,
    data
  );
  await auditAction(
    req,
    "base_register_created",
    "base_register",
    register.id,
    {
      module: register.module,
      name: register.name
    }
  );
  return res.status(201).json(register);
};

export const updateBaseRegister = async (
  req: Request,
  res: Response
): Promise<Response> => {
  ensureCanManage(req.user.profile);
  const data = await validate<BaseRegisterService.BaseRegisterData>(
    baseRegisterSchema,
    req.body
  );
  if (isStateModule(req.params.module)) {
    const state = await StateCityService.updateState(
      req.params.registerId,
      baseRegisterToStateData(data)
    );
    await auditAction(req, "state_updated", "state", state.id, {
      uf: state.uf,
      name: state.name
    });
    return res.json(state);
  }
  if (isCityModule(req.params.module)) {
    const city = await StateCityService.updateCity(
      req.params.registerId,
      baseRegisterToCityData(data)
    );
    await auditAction(req, "city_updated", "city", city.id, {
      stateId: city.stateId,
      name: city.name
    });
    return res.json(city);
  }
  const register = await BaseRegisterService.update(
    req.user.tenantId,
    req.params.module,
    req.params.registerId,
    data
  );
  await auditAction(
    req,
    "base_register_updated",
    "base_register",
    register.id,
    {
      module: register.module,
      name: register.name
    }
  );
  return res.json(register);
};

export const deleteBaseRegister = async (
  req: Request,
  res: Response
): Promise<Response> => {
  ensureCanManage(req.user.profile);
  if (isStateModule(req.params.module)) {
    await StateCityService.deleteState(req.params.registerId);
    await auditAction(req, "state_deleted", "state", req.params.registerId);
    return res.status(204).send();
  }
  if (isCityModule(req.params.module)) {
    await StateCityService.deleteCity(req.params.registerId);
    await auditAction(req, "city_deleted", "city", req.params.registerId);
    return res.status(204).send();
  }
  BaseRegisterService.ensureValidModule(req.params.module);
  await BaseRegisterService.remove(
    req.user.tenantId,
    req.params.module,
    req.params.registerId
  );
  await auditAction(
    req,
    "base_register_deleted",
    "base_register",
    req.params.registerId,
    { module: req.params.module }
  );
  return res.status(204).send();
};

export const listClientUnits = async (
  req: Request,
  res: Response
): Promise<Response> => {
  ensureCanManage(req.user.profile);
  return res.json(await ClientUnitService.list(req.user.tenantId, req.query));
};

export const exportBaseRegisters = async (
  req: Request,
  res: Response
): Promise<Response> => {
  ensureCanExport(req.user.profile);
  const format = getExportFormat(req.query.format);
  const { module } = req.params;
  const columns: ExportColumn[] = [
    { key: "id", label: "ID" },
    { key: "code", label: "Codigo" },
    { key: "name", label: "Nome" },
    { key: "description", label: "Descricao" },
    { key: "status", label: "Status" },
    { key: "data", label: "Dados" }
  ];

  if (isStateModule(module)) {
    const result = await StateCityService.listStates(req.query, true);
    return sendExport(res, result.rows, columns, format, "estados");
  }

  if (isCityModule(module)) {
    const result = await StateCityService.listCities(req.query, true);
    return sendExport(
      res,
      result.rows,
      [
        ...columns,
        { key: "state.uf", label: "UF" },
        { key: "state.name", label: "Estado" }
      ],
      format,
      "cidades"
    );
  }

  const rows = await BaseRegisterService.listForExport(
    req.user.tenantId,
    module,
    req.query
  );
  return sendExport(res, rows as LegacyAny, columns, format, module);
};

export const exportClientUnits = async (
  req: Request,
  res: Response
): Promise<Response> => {
  ensureCanExport(req.user.profile);
  const rows = await ClientUnitService.listForExport(
    req.user.tenantId,
    req.query
  );
  return sendExport(
    res,
    rows as LegacyAny,
    [
      { key: "id", label: "ID" },
      { key: "code", label: "Codigo" },
      { key: "name", label: "Unidade" },
      { key: "client.legalName", label: "Cliente" },
      { key: "responsibleName", label: "Responsavel" },
      { key: "phone", label: "Telefone" },
      { key: "email", label: "Email" },
      { key: "city", label: "Cidade" },
      { key: "state", label: "UF" },
      { key: "status", label: "Status" }
    ],
    getExportFormat(req.query.format),
    "unidades"
  );
};

export const createClientUnit = async (
  req: Request,
  res: Response
): Promise<Response> => {
  ensureCanManage(req.user.profile);
  const data = await validate<ClientUnitService.ClientUnitData>(
    clientUnitSchema,
    req.body
  );
  const unit = await ClientUnitService.create(req.user.tenantId, data);
  await auditAction(req, "client_unit_created", "client_unit", unit.id, {
    clientId: unit.clientId,
    name: unit.name
  });
  return res.status(201).json(unit);
};

export const updateClientUnit = async (
  req: Request,
  res: Response
): Promise<Response> => {
  ensureCanManage(req.user.profile);
  const data = await validate<ClientUnitService.ClientUnitData>(
    clientUnitSchema,
    req.body
  );
  const unit = await ClientUnitService.update(
    req.user.tenantId,
    req.params.unitId,
    data
  );
  await auditAction(req, "client_unit_updated", "client_unit", unit.id, {
    clientId: unit.clientId,
    name: unit.name
  });
  return res.json(unit);
};

export const deleteClientUnit = async (
  req: Request,
  res: Response
): Promise<Response> => {
  ensureCanManage(req.user.profile);
  await ClientUnitService.remove(req.user.tenantId, req.params.unitId);
  await auditAction(
    req,
    "client_unit_deleted",
    "client_unit",
    req.params.unitId
  );
  return res.status(204).send();
};

export const listBaseRegisterAudit = async (
  req: Request,
  res: Response
): Promise<Response> => {
  ensureCanManage(req.user.profile);
  return res.json(
    await listAuditLogs({
      tenantId: req.user.tenantId,
      resources: ["base_register", "client_unit"],
      limit: Number(req.query.limit) || 100
    })
  );
};
