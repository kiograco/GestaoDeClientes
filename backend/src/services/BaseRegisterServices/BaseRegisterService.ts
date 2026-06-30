import { Op } from "sequelize";
import AppError from "../../errors/AppError";
import BaseRegister from "../../models/BaseRegister";

export const BASE_REGISTER_MODULES = [
  "methods",
  "non-conformities",
  "tools",
  "equipment",
  "vehicles",
  "chart-of-accounts",
  "payment-methods",
  "closing-types",
  "service-order-statuses",
  "suppliers",
  "general-parameters"
] as const;

export type BaseRegisterModule = typeof BASE_REGISTER_MODULES[number];

export interface BaseRegisterData {
  code?: string | null;
  name: string;
  description?: string | null;
  status?: string;
  data?: Record<string, unknown> | null;
}

export interface BaseRegisterListParams {
  searchParam?: string;
  status?: string;
  pageNumber?: string | number;
  rowsPerPage?: string | number;
}

export const ensureValidModule = (module: string): BaseRegisterModule => {
  if (!BASE_REGISTER_MODULES.includes(module as BaseRegisterModule)) {
    throw new AppError("ERR_BASE_REGISTER_MODULE_NOT_FOUND", 404);
  }
  return module as BaseRegisterModule;
};

const paginationParams = (params: BaseRegisterListParams) => {
  const limit = Math.min(Math.max(Number(params.rowsPerPage) || 20, 1), 100);
  const page = Math.max(Number(params.pageNumber) || 1, 1);
  return { limit, offset: limit * (page - 1) };
};

export const list = async (
  tenantId: number,
  moduleParam: string,
  params: BaseRegisterListParams
): Promise<{
  count: number;
  hasMore: boolean;
  rows: BaseRegister[];
}> => {
  const module = ensureValidModule(moduleParam);
  const { limit, offset } = paginationParams(params);
  const searchParam = String(params.searchParam || "").trim();
  const where: LegacyAny = {
    tenantId,
    module,
    ...(params.status ? { status: params.status } : {})
  };

  if (searchParam) {
    where[Op.or] = [
      { name: { [Op.iLike]: `%${searchParam}%` } },
      { code: { [Op.iLike]: `%${searchParam}%` } },
      { description: { [Op.iLike]: `%${searchParam}%` } }
    ];
  }

  const { count, rows } = await BaseRegister.findAndCountAll({
    where,
    order: [
      ["name", "ASC"],
      ["id", "ASC"]
    ],
    limit,
    offset
  });

  return { count, hasMore: count > offset + rows.length, rows };
};

export const listForExport = async (
  tenantId: number,
  moduleParam: string,
  params: BaseRegisterListParams
): Promise<Record<string, unknown>[]> => {
  const module = ensureValidModule(moduleParam);
  const searchParam = String(params.searchParam || "").trim();
  const where: LegacyAny = {
    tenantId,
    module,
    ...(params.status ? { status: params.status } : {})
  };

  if (searchParam) {
    where[Op.or] = [
      { name: { [Op.iLike]: `%${searchParam}%` } },
      { code: { [Op.iLike]: `%${searchParam}%` } },
      { description: { [Op.iLike]: `%${searchParam}%` } }
    ];
  }

  return BaseRegister.findAll({
    where,
    order: [
      ["name", "ASC"],
      ["id", "ASC"]
    ],
    limit: 10000
  }) as LegacyAny;
};

export const create = async (
  tenantId: number,
  moduleParam: string,
  data: BaseRegisterData
): Promise<BaseRegister> => {
  const module = ensureValidModule(moduleParam);
  return BaseRegister.create({
    tenantId,
    module,
    code: data.code || null,
    name: data.name,
    description: data.description || null,
    status: data.status || "active",
    data: data.data || {}
  } as LegacyAny);
};

export const update = async (
  tenantId: number,
  moduleParam: string,
  registerId: string | number,
  data: BaseRegisterData
): Promise<BaseRegister> => {
  const module = ensureValidModule(moduleParam);
  const register = await BaseRegister.findOne({
    where: { id: registerId, tenantId, module }
  });
  if (!register) throw new AppError("ERR_BASE_REGISTER_NOT_FOUND", 404);

  await register.update({
    code: data.code || null,
    name: data.name,
    description: data.description || null,
    status: data.status || "active",
    data: data.data || {}
  });

  return register;
};

export const remove = async (
  tenantId: number,
  moduleParam: string,
  registerId: string | number
): Promise<void> => {
  const module = ensureValidModule(moduleParam);
  const register = await BaseRegister.findOne({
    where: { id: registerId, tenantId, module }
  });
  if (!register) throw new AppError("ERR_BASE_REGISTER_NOT_FOUND", 404);
  await register.destroy();
};
