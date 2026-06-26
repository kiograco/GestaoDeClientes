import { Op } from "sequelize";
import AppError from "../errors/AppError";
import AttendanceType from "../models/AttendanceType";
import SalesProposal from "../models/SalesProposal";
import ServiceOrder from "../models/ServiceOrder";
import Ticket from "../models/Ticket";
import {
  exportRows,
  ExportFormat
} from "./BaseRegisterServices/BaseRegisterExportService";
import * as Repository from "./AttendanceTypeRepository";

export interface AttendanceTypeData {
  name: string;
  description?: string | null;
  isActive?: boolean;
}

export const list = async (
  tenantId: string | number,
  params: Repository.AttendanceTypeListParams
): Promise<{ count: number; hasMore: boolean; rows: AttendanceType[] }> => {
  const { count, rows } = await Repository.findAndCount(tenantId, params);
  const page = Math.max(Number(params.pageNumber) || 1, 1);
  const limit = Math.min(Math.max(Number(params.rowsPerPage) || 20, 1), 100);
  return { count, hasMore: count > page * limit, rows };
};

export const listForExport = (
  tenantId: string | number,
  params: Repository.AttendanceTypeListParams
): Promise<AttendanceType[]> => Repository.findForExport(tenantId, params);

const ensureUniqueName = async (
  tenantId: string | number,
  name: string,
  excludeId?: string | number
): Promise<void> => {
  const duplicated = await Repository.findByName(tenantId, name, excludeId);
  if (duplicated) throw new AppError("ERR_ATTENDANCE_TYPE_DUPLICATED", 409);
};

export const show = async (
  tenantId: string | number,
  id: string | number
): Promise<AttendanceType> => {
  const attendanceType = await Repository.findById(tenantId, id);
  if (!attendanceType) throw new AppError("ERR_ATTENDANCE_TYPE_NOT_FOUND", 404);
  return attendanceType;
};

export const create = async (
  tenantId: string | number,
  data: AttendanceTypeData
): Promise<AttendanceType> => {
  await ensureUniqueName(tenantId, data.name);
  return AttendanceType.create({
    tenantId: Number(tenantId),
    name: data.name.trim(),
    description: data.description || null,
    isActive: data.isActive !== false
  });
};

export const update = async (
  tenantId: string | number,
  id: string | number,
  data: AttendanceTypeData
): Promise<AttendanceType> => {
  const attendanceType = await show(tenantId, id);
  await ensureUniqueName(tenantId, data.name, id);
  await attendanceType.update({
    name: data.name.trim(),
    description: data.description || null,
    isActive: data.isActive !== false
  });
  return attendanceType;
};

export const setActive = async (
  tenantId: string | number,
  id: string | number,
  isActive: boolean
): Promise<AttendanceType> => {
  const attendanceType = await show(tenantId, id);
  await attendanceType.update({ isActive });
  return attendanceType;
};

export const hasLinks = async (
  tenantId: string | number,
  attendanceType: AttendanceType
): Promise<boolean> => {
  const [orders, proposals, tickets] = await Promise.all([
    ServiceOrder.count({
      where: {
        tenantId,
        [Op.or]: [
          { attendanceTypeId: attendanceType.id },
          { serviceType: attendanceType.name }
        ]
      }
    }),
    SalesProposal.count({
      where: {
        tenantId,
        [Op.or]: [
          { attendanceTypeId: attendanceType.id },
          { title: attendanceType.name }
        ]
      }
    }),
    Ticket.count({ where: { tenantId, attendanceTypeId: attendanceType.id } })
  ]);
  return orders + proposals + tickets > 0;
};

export const remove = async (
  tenantId: string | number,
  id: string | number
): Promise<"deleted" | "inactivated"> => {
  const attendanceType = await show(tenantId, id);
  if (await hasLinks(tenantId, attendanceType)) {
    await attendanceType.update({ isActive: false });
    return "inactivated";
  }
  await attendanceType.destroy();
  return "deleted";
};

export const exportAttendanceTypes = async (
  tenantId: string | number,
  params: Repository.AttendanceTypeListParams,
  format: ExportFormat
): Promise<{ buffer: Buffer; contentType: string; fileName: string }> => {
  const rows = await listForExport(tenantId, params);
  return exportRows(
    rows as LegacyAny,
    [
      { key: "id", label: "ID" },
      { key: "name", label: "Nome" },
      { key: "description", label: "Descricao" },
      { key: "isActive", label: "Ativo" },
      { key: "createdAt", label: "Criado em" },
      { key: "updatedAt", label: "Atualizado em" }
    ],
    format,
    "tipos-atendimento"
  );
};
