import { Op } from "sequelize";
import sequelize from "../../database";
import AppError from "../../errors/AppError";
import Client from "../../models/Client";
import ClientAddress from "../../models/ClientAddress";
import ClientArea from "../../models/ClientArea";
import ClientSector from "../../models/ClientSector";
import MonitoringPoint from "../../models/MonitoringPoint";
import MonitoringPointHistory from "../../models/MonitoringPointHistory";
import TrapType from "../../models/TrapType";

export interface TrapTypeData {
  name: string;
  code: string;
  type: string;
  description?: string | null;
  active?: boolean;
}

export interface MonitoringPointData {
  clientId: number;
  addressId: number;
  areaId: number;
  sectorId: number;
  trapTypeId: number;
  owner: string;
  installedAt: string;
  initialNumber: number;
  finalNumber: number;
  notes?: string | null;
}

export interface MonitoringPointUpdateData {
  addressId?: number;
  areaId?: number;
  sectorId?: number;
  trapTypeId?: number;
  owner?: string;
  installedAt?: string;
  pointNumber?: number;
  label?: string;
  notes?: string | null;
  active?: boolean;
  historyAction?: string;
  historyNotes?: string | null;
}

const nullable = (value?: string | number | null): string | null => {
  if (value === null || value === undefined) return null;
  const text = String(value).trim();
  return text || null;
};

const pointInclude = [
  { model: Client, as: "client", required: false },
  { model: ClientAddress, as: "address", required: false },
  { model: ClientArea, as: "area", required: false },
  { model: ClientSector, as: "sector", required: false },
  { model: TrapType, as: "trapType", required: false },
  { model: MonitoringPointHistory, as: "history", required: false }
];

const ensureUniqueTrapCode = async (
  tenantId: string | number,
  code: string,
  trapTypeId?: string
) => {
  const duplicate = await TrapType.findOne({
    where: {
      tenantId,
      code,
      ...(trapTypeId ? { id: { [Op.ne]: trapTypeId } } : {})
    }
  });
  if (duplicate) throw new AppError("ERR_TRAP_TYPE_CODE_ALREADY_EXISTS", 409);
};

const ensureTrapType = async (
  tenantId: string | number,
  trapTypeId: number
): Promise<TrapType> => {
  const trapType = await TrapType.findOne({
    where: { id: trapTypeId, tenantId }
  });
  if (!trapType) throw new AppError("ERR_TRAP_TYPE_NOT_FOUND", 404);
  return trapType;
};

const ensureLocation = async (
  tenantId: string | number,
  clientId: number,
  addressId: number,
  areaId: number,
  sectorId: number
) => {
  const client = await Client.findOne({ where: { id: clientId, tenantId } });
  if (!client) throw new AppError("ERR_CLIENT_NOT_FOUND", 404);
  const address = await ClientAddress.findOne({
    where: { id: addressId, clientId, tenantId }
  });
  if (!address) throw new AppError("ERR_CLIENT_ADDRESS_NOT_FOUND", 404);
  const area = await ClientArea.findOne({
    where: { id: areaId, clientId, addressId, tenantId }
  });
  if (!area) throw new AppError("ERR_CLIENT_AREA_NOT_FOUND", 404);
  const sector = await ClientSector.findOne({
    where: { id: sectorId, areaId, tenantId }
  });
  if (!sector) throw new AppError("ERR_CLIENT_SECTOR_NOT_FOUND", 404);
};

const showPoint = async (
  tenantId: string | number,
  pointId: string | number
): Promise<MonitoringPoint> => {
  const point = await MonitoringPoint.findOne({
    where: { id: pointId, tenantId },
    include: pointInclude,
    order: [[{ model: MonitoringPointHistory, as: "history" }, "id", "ASC"]]
  });
  if (!point) throw new AppError("ERR_MONITORING_POINT_NOT_FOUND", 404);
  return point;
};

const createHistory = (
  tenantId: string | number,
  point: MonitoringPoint,
  action: string,
  transaction: LegacyAny,
  notes?: string | null,
  previous?: Pick<MonitoringPoint, "areaId" | "sectorId">
) =>
  MonitoringPointHistory.create(
    {
      tenantId,
      monitoringPointId: point.id,
      action,
      previousAreaId: previous?.areaId || null,
      newAreaId: point.areaId || null,
      previousSectorId: previous?.sectorId || null,
      newSectorId: point.sectorId || null,
      notes: nullable(notes),
      metadata: {
        label: point.label,
        trapTypeId: point.trapTypeId
      }
    },
    { transaction }
  );

const monitoringActionForUpdate = ({
  explicitAction,
  active,
  movedSector,
  movedArea
}: {
  explicitAction?: string;
  active?: boolean;
  movedSector: boolean;
  movedArea: boolean;
}): string => {
  if (explicitAction) return explicitAction;
  if (active === false) return "removal";
  if (movedSector) return "sector_change";
  if (movedArea) return "area_change";
  return "replacement";
};

export const listTrapTypes = async (
  tenantId: string | number
): Promise<TrapType[]> =>
  TrapType.findAll({ where: { tenantId }, order: [["name", "ASC"]] });

export const createTrapType = async (
  tenantId: string | number,
  data: TrapTypeData
): Promise<TrapType> => {
  await ensureUniqueTrapCode(tenantId, data.code);
  return TrapType.create({
    tenantId,
    name: data.name.trim(),
    code: data.code.trim(),
    type: data.type.trim(),
    description: nullable(data.description),
    active: data.active !== false
  });
};

export const updateTrapType = async (
  tenantId: string | number,
  trapTypeId: string,
  data: TrapTypeData
): Promise<TrapType> => {
  const trapType = await TrapType.findOne({
    where: { id: trapTypeId, tenantId }
  });
  if (!trapType) throw new AppError("ERR_TRAP_TYPE_NOT_FOUND", 404);
  await ensureUniqueTrapCode(tenantId, data.code, trapTypeId);
  await trapType.update({
    name: data.name.trim(),
    code: data.code.trim(),
    type: data.type.trim(),
    description: nullable(data.description),
    active: data.active !== false
  });
  return trapType;
};

export const deleteTrapType = async (
  tenantId: string | number,
  trapTypeId: string
): Promise<void> => {
  const trapType = await TrapType.findOne({
    where: { id: trapTypeId, tenantId }
  });
  if (!trapType) throw new AppError("ERR_TRAP_TYPE_NOT_FOUND", 404);
  const inUse = await MonitoringPoint.count({
    where: { tenantId, trapTypeId }
  });
  if (inUse) throw new AppError("ERR_TRAP_TYPE_IN_USE", 409);
  await trapType.destroy();
};

export const listPoints = async (
  tenantId: string | number,
  filters: {
    clientId?: string;
    addressId?: string;
    areaId?: string;
    sectorId?: string;
  } = {}
): Promise<MonitoringPoint[]> =>
  MonitoringPoint.findAll({
    where: {
      tenantId,
      ...(filters.clientId ? { clientId: filters.clientId } : {}),
      ...(filters.addressId ? { addressId: filters.addressId } : {}),
      ...(filters.areaId ? { areaId: filters.areaId } : {}),
      ...(filters.sectorId ? { sectorId: filters.sectorId } : {})
    },
    include: pointInclude,
    order: [
      ["clientId", "ASC"],
      ["pointNumber", "ASC"]
    ]
  });

export const createPoints = async (
  tenantId: string | number,
  data: MonitoringPointData
): Promise<MonitoringPoint[]> => {
  if (data.finalNumber < data.initialNumber) {
    throw new AppError("ERR_MONITORING_INVALID_NUMBER_RANGE", 400);
  }
  if (data.finalNumber - data.initialNumber > 499) {
    throw new AppError("ERR_MONITORING_NUMBER_RANGE_TOO_LARGE", 400);
  }
  await ensureTrapType(tenantId, data.trapTypeId);
  await ensureLocation(
    tenantId,
    data.clientId,
    data.addressId,
    data.areaId,
    data.sectorId
  );

  const createdIds = await sequelize.transaction(async transaction => {
    const numbers = Array.from(
      { length: data.finalNumber - data.initialNumber + 1 },
      (_, index) => data.initialNumber + index
    );
    const points = await MonitoringPoint.bulkCreate(
      numbers.map(pointNumber => ({
        tenantId,
        clientId: data.clientId,
        addressId: data.addressId,
        areaId: data.areaId,
        sectorId: data.sectorId,
        trapTypeId: data.trapTypeId,
        owner: data.owner,
        installedAt: data.installedAt,
        pointNumber,
        label: `Armadilha ${pointNumber}`,
        notes: nullable(data.notes),
        active: true
      })),
      { transaction, returning: true }
    );
    await Promise.all(
      points.map(point =>
        createHistory(tenantId, point, "installation", transaction, data.notes)
      )
    );
    return points.map(point => point.id);
  });

  return MonitoringPoint.findAll({
    where: { tenantId, id: createdIds },
    include: pointInclude,
    order: [["pointNumber", "ASC"]]
  });
};

export const updatePoint = async (
  tenantId: string | number,
  pointId: string,
  data: MonitoringPointUpdateData
): Promise<MonitoringPoint> => {
  const point = await MonitoringPoint.findOne({
    where: { id: pointId, tenantId }
  });
  if (!point) throw new AppError("ERR_MONITORING_POINT_NOT_FOUND", 404);
  const next = {
    addressId: data.addressId || point.addressId,
    areaId: data.areaId || point.areaId,
    sectorId: data.sectorId || point.sectorId,
    trapTypeId: data.trapTypeId || point.trapTypeId
  };
  await ensureTrapType(tenantId, next.trapTypeId);
  await ensureLocation(
    tenantId,
    point.clientId,
    next.addressId,
    next.areaId,
    next.sectorId
  );

  const previous = { areaId: point.areaId, sectorId: point.sectorId };
  await sequelize.transaction(async transaction => {
    await point.update(
      {
        addressId: next.addressId,
        areaId: next.areaId,
        sectorId: next.sectorId,
        trapTypeId: next.trapTypeId,
        owner: data.owner || point.owner,
        installedAt: data.installedAt || point.installedAt,
        pointNumber: data.pointNumber || point.pointNumber,
        label: data.label || point.label,
        notes: nullable(data.notes) || point.notes,
        active: data.active !== undefined ? data.active : point.active
      },
      { transaction }
    );
    const movedArea = previous.areaId !== point.areaId;
    const movedSector = previous.sectorId !== point.sectorId;
    const action = monitoringActionForUpdate({
      explicitAction: data.historyAction,
      active: data.active,
      movedSector,
      movedArea
    });
    await createHistory(
      tenantId,
      point,
      action,
      transaction,
      data.historyNotes,
      previous
    );
  });
  return showPoint(tenantId, pointId);
};

export const removePoint = async (
  tenantId: string | number,
  pointId: string,
  notes?: string
): Promise<void> => {
  const point = await MonitoringPoint.findOne({
    where: { id: pointId, tenantId }
  });
  if (!point) throw new AppError("ERR_MONITORING_POINT_NOT_FOUND", 404);
  await sequelize.transaction(async transaction => {
    await createHistory(tenantId, point, "removal", transaction, notes);
    await point.destroy({ transaction });
  });
};
