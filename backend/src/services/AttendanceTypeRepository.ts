import { Op } from "sequelize";
import AttendanceType from "../models/AttendanceType";

export interface AttendanceTypeListParams {
  searchParam?: string;
  isActive?: string | boolean;
  pageNumber?: string | number;
  rowsPerPage?: string | number;
}

const paginationParams = (params: AttendanceTypeListParams) => {
  const limit = Math.min(Math.max(Number(params.rowsPerPage) || 20, 1), 100);
  const page = Math.max(Number(params.pageNumber) || 1, 1);
  return { limit, offset: limit * (page - 1) };
};

const buildWhere = (
  tenantId: string | number,
  params: AttendanceTypeListParams
): LegacyAny => {
  const searchParam = String(params.searchParam || "").trim();
  const where: LegacyAny = { tenantId };

  if (params.isActive !== undefined && params.isActive !== "") {
    where.isActive =
      params.isActive === true || String(params.isActive) === "true";
  }

  if (searchParam) {
    where[Op.or] = [
      { name: { [Op.iLike]: `%${searchParam}%` } },
      { description: { [Op.iLike]: `%${searchParam}%` } }
    ];
  }

  return where;
};

export const findAndCount = async (
  tenantId: string | number,
  params: AttendanceTypeListParams
): Promise<{ count: number; rows: AttendanceType[] }> => {
  const { limit, offset } = paginationParams(params);
  return AttendanceType.findAndCountAll({
    where: buildWhere(tenantId, params),
    order: [
      ["name", "ASC"],
      ["id", "ASC"]
    ],
    limit,
    offset
  });
};

export const findForExport = async (
  tenantId: string | number,
  params: AttendanceTypeListParams
): Promise<AttendanceType[]> =>
  AttendanceType.findAll({
    where: buildWhere(tenantId, params),
    order: [
      ["name", "ASC"],
      ["id", "ASC"]
    ],
    limit: 10000
  });

export const findById = async (
  tenantId: string | number,
  id: string | number
): Promise<AttendanceType | null> =>
  AttendanceType.findOne({ where: { tenantId, id } });

export const findByName = async (
  tenantId: string | number,
  name: string,
  excludeId?: string | number
): Promise<AttendanceType | null> =>
  AttendanceType.findOne({
    where: {
      tenantId,
      name: { [Op.iLike]: name },
      ...(excludeId ? { id: { [Op.ne]: excludeId } } : {})
    }
  });
