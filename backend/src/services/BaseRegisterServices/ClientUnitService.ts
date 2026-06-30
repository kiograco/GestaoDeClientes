import { Op } from "sequelize";
import AppError from "../../errors/AppError";
import Client from "../../models/Client";
import ClientUnit from "../../models/ClientUnit";

export interface ClientUnitData {
  clientId: number;
  code?: string | null;
  name: string;
  responsibleName?: string | null;
  phone?: string | null;
  email?: string | null;
  zipCode?: string | null;
  street?: string | null;
  number?: string | null;
  complement?: string | null;
  neighborhood?: string | null;
  city?: string | null;
  state?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  status?: string;
  observations?: string | null;
}

interface ClientUnitListParams {
  searchParam?: string;
  status?: string;
  clientId?: string | number;
  pageNumber?: string | number;
  rowsPerPage?: string | number;
}

const paginationParams = (params: ClientUnitListParams) => {
  const limit = Math.min(Math.max(Number(params.rowsPerPage) || 20, 1), 100);
  const page = Math.max(Number(params.pageNumber) || 1, 1);
  return { limit, offset: limit * (page - 1) };
};

const ensureClientBelongsToTenant = async (
  tenantId: number,
  clientId: string | number
): Promise<void> => {
  const client = await Client.findOne({ where: { id: clientId, tenantId } });
  if (!client) throw new AppError("ERR_CLIENT_NOT_FOUND", 404);
};

export const list = async (
  tenantId: number,
  params: ClientUnitListParams
): Promise<{
  count: number;
  hasMore: boolean;
  rows: ClientUnit[];
}> => {
  const { limit, offset } = paginationParams(params);
  const searchParam = String(params.searchParam || "").trim();
  const where: LegacyAny = {
    tenantId,
    ...(params.status ? { status: params.status } : {}),
    ...(params.clientId ? { clientId: params.clientId } : {})
  };

  if (searchParam) {
    where[Op.or] = [
      { name: { [Op.iLike]: `%${searchParam}%` } },
      { code: { [Op.iLike]: `%${searchParam}%` } },
      { responsibleName: { [Op.iLike]: `%${searchParam}%` } },
      { city: { [Op.iLike]: `%${searchParam}%` } }
    ];
  }

  const { count, rows } = await ClientUnit.findAndCountAll({
    where,
    include: [{ model: Client, attributes: ["id", "legalName", "tradeName"] }],
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
  params: ClientUnitListParams
): Promise<ClientUnit[]> => {
  const result = await list(tenantId, { ...params, rowsPerPage: 100 });
  if (result.count <= result.rows.length) return result.rows;
  const searchParam = String(params.searchParam || "").trim();
  const where: LegacyAny = {
    tenantId,
    ...(params.status ? { status: params.status } : {}),
    ...(params.clientId ? { clientId: params.clientId } : {})
  };
  if (searchParam) {
    where[Op.or] = [
      { name: { [Op.iLike]: `%${searchParam}%` } },
      { code: { [Op.iLike]: `%${searchParam}%` } },
      { responsibleName: { [Op.iLike]: `%${searchParam}%` } },
      { city: { [Op.iLike]: `%${searchParam}%` } }
    ];
  }
  return ClientUnit.findAll({
    where,
    include: [{ model: Client, attributes: ["id", "legalName", "tradeName"] }],
    order: [
      ["name", "ASC"],
      ["id", "ASC"]
    ],
    limit: 10000
  });
};

export const create = async (
  tenantId: number,
  data: ClientUnitData
): Promise<ClientUnit> => {
  await ensureClientBelongsToTenant(tenantId, data.clientId);
  return ClientUnit.create({
    ...data,
    tenantId,
    code: data.code || null,
    status: data.status || "active"
  } as LegacyAny);
};

export const update = async (
  tenantId: number,
  unitId: string | number,
  data: ClientUnitData
): Promise<ClientUnit> => {
  await ensureClientBelongsToTenant(tenantId, data.clientId);
  const unit = await ClientUnit.findOne({ where: { id: unitId, tenantId } });
  if (!unit) throw new AppError("ERR_CLIENT_UNIT_NOT_FOUND", 404);
  await unit.update({ ...data, code: data.code || null });
  return unit;
};

export const remove = async (
  tenantId: number,
  unitId: string | number
): Promise<void> => {
  const unit = await ClientUnit.findOne({ where: { id: unitId, tenantId } });
  if (!unit) throw new AppError("ERR_CLIENT_UNIT_NOT_FOUND", 404);
  await unit.destroy();
};
