import { Op } from "sequelize";
import sequelize from "../../database";
import AppError from "../../errors/AppError";
import Client from "../../models/Client";
import ClientAddress from "../../models/ClientAddress";
import ClientArea from "../../models/ClientArea";
import ClientFloorPlan from "../../models/ClientFloorPlan";
import ClientSector from "../../models/ClientSector";
import MonitoringPoint from "../../models/MonitoringPoint";
import MonitoringPointHistory from "../../models/MonitoringPointHistory";
import Pest from "../../models/Pest";
import TrapAction from "../../models/TrapAction";
import TrapCondition from "../../models/TrapCondition";
import TrapInspection from "../../models/TrapInspection";
import TrapInspectionAction from "../../models/TrapInspectionAction";
import TrapInspectionCondition from "../../models/TrapInspectionCondition";
import TrapType from "../../models/TrapType";
import TrapTypePest from "../../models/TrapTypePest";
import User from "../../models/User";

export interface TrapTypeData {
  name: string;
  code: string;
  acronym?: string | null;
  type: string;
  description?: string | null;
  active?: boolean;
  pestIds?: number[];
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

export interface FloorPlanData {
  clientId: number;
  addressId: number;
  name: string;
  fileUrl: string;
  fileType: string;
  originalFilename: string;
  notes?: string | null;
}

export interface PointPositionData {
  floorPlanId: number;
  positionX: number;
  positionY: number;
  mapLabel?: string | null;
}

export interface TrapCatalogData {
  name: string;
  active?: boolean;
}

export interface TrapInspectionData {
  monitoringPointId: number;
  technicianId?: number | null;
  inspectionDate?: string | Date | null;
  conditionIds?: number[];
  actionIds?: number[];
  notes?: string | null;
}

const defaultConditionNames = [
  "Instalada",
  "Avariada",
  "Extraviada",
  "Sem acesso",
  "Suja"
];

const defaultActionNames = [
  "Isca trocada por avaria",
  "Isca trocada por consumo",
  "Manutenção e limpeza",
  "Monitorada",
  "Refil trocado",
  "Isca intacta",
  "Refil intacto",
  "Armadilha substituída",
  "Pedir reposição",
  "Troca de adesivo"
];

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
  { model: ClientFloorPlan, as: "floorPlan", required: false },
  { model: TrapType, as: "trapType", required: false },
  { model: MonitoringPointHistory, as: "history", required: false },
  {
    model: TrapInspection,
    as: "inspections",
    required: false,
    include: [
      { model: User, as: "technician", attributes: ["id", "name"] },
      { model: TrapCondition, as: "conditions" },
      { model: TrapAction, as: "actions" }
    ]
  }
];

const trapTypeInclude = [
  {
    model: TrapTypePest,
    as: "trapTypePests",
    required: false,
    include: [{ model: Pest, as: "pest", required: false }]
  },
  { model: Pest, as: "pests", required: false }
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

const ensureFloorPlan = async (
  tenantId: string | number,
  floorPlanId: number
): Promise<ClientFloorPlan> => {
  const floorPlan = await ClientFloorPlan.findOne({
    where: { id: floorPlanId, tenantId }
  });
  if (!floorPlan) throw new AppError("ERR_FLOOR_PLAN_NOT_FOUND", 404);
  return floorPlan;
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

const ensurePests = async (
  tenantId: string | number,
  pestIds: number[] = []
): Promise<void> => {
  if (!pestIds.length) return;
  const count = await Pest.count({
    where: { tenantId, id: { [Op.in]: pestIds } }
  });
  if (count !== new Set(pestIds).size)
    throw new AppError("ERR_PEST_NOT_FOUND", 404);
};

const syncTrapTypePests = async (
  tenantId: string | number,
  trapTypeId: number,
  pestIds: number[] = [],
  transaction: LegacyAny
): Promise<void> => {
  const uniquePestIds = Array.from(
    new Set(pestIds.map(Number).filter(Boolean))
  );
  await ensurePests(tenantId, uniquePestIds);
  await TrapTypePest.destroy({ where: { tenantId, trapTypeId }, transaction });
  if (!uniquePestIds.length) return;
  await TrapTypePest.bulkCreate(
    uniquePestIds.map(pestId => ({ tenantId, trapTypeId, pestId })),
    { transaction }
  );
};

const showTrapType = async (
  tenantId: string | number,
  trapTypeId: string | number
): Promise<TrapType> => {
  const trapType = await TrapType.findOne({
    where: { id: trapTypeId, tenantId },
    include: trapTypeInclude
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
  TrapType.findAll({
    where: { tenantId },
    include: trapTypeInclude,
    order: [["name", "ASC"]]
  });

export const createTrapType = async (
  tenantId: string | number,
  data: TrapTypeData
): Promise<TrapType> => {
  await ensureUniqueTrapCode(tenantId, data.code);
  const trapType = await sequelize.transaction(async transaction => {
    const created = await TrapType.create(
      {
        tenantId,
        name: data.name.trim(),
        code: data.code.trim(),
        acronym: nullable(data.acronym) || data.code.trim(),
        type: data.type?.trim() || "monitoramento",
        description: nullable(data.description),
        active: data.active !== false
      },
      { transaction }
    );
    await syncTrapTypePests(tenantId, created.id, data.pestIds, transaction);
    return created;
  });
  return showTrapType(tenantId, trapType.id);
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
  await sequelize.transaction(async transaction => {
    await trapType.update(
      {
        name: data.name.trim(),
        code: data.code.trim(),
        acronym: nullable(data.acronym) || data.code.trim(),
        type: data.type?.trim() || "monitoramento",
        description: nullable(data.description),
        active: data.active !== false
      },
      { transaction }
    );
    await syncTrapTypePests(tenantId, trapType.id, data.pestIds, transaction);
  });
  return showTrapType(tenantId, trapTypeId);
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

export const listConditions = async (
  tenantId: string | number
): Promise<TrapCondition[]> => {
  const count = await TrapCondition.count({ where: { tenantId } });
  if (!count) {
    await TrapCondition.bulkCreate(
      defaultConditionNames.map(name => ({ tenantId, name, active: true }))
    );
  }
  return TrapCondition.findAll({
    where: { tenantId },
    order: [["name", "ASC"]]
  });
};

export const createCondition = async (
  tenantId: string | number,
  data: TrapCatalogData
): Promise<TrapCondition> =>
  TrapCondition.create({
    tenantId,
    name: data.name.trim(),
    active: data.active !== false
  });

export const updateCondition = async (
  tenantId: string | number,
  conditionId: string,
  data: TrapCatalogData
): Promise<TrapCondition> => {
  const condition = await TrapCondition.findOne({
    where: { id: conditionId, tenantId }
  });
  if (!condition) throw new AppError("ERR_TRAP_CONDITION_NOT_FOUND", 404);
  await condition.update({
    name: data.name.trim(),
    active: data.active !== false
  });
  return condition;
};

export const listActions = async (
  tenantId: string | number
): Promise<TrapAction[]> => {
  const count = await TrapAction.count({ where: { tenantId } });
  if (!count) {
    await TrapAction.bulkCreate(
      defaultActionNames.map(name => ({ tenantId, name, active: true }))
    );
  }
  return TrapAction.findAll({ where: { tenantId }, order: [["name", "ASC"]] });
};

export const createAction = async (
  tenantId: string | number,
  data: TrapCatalogData
): Promise<TrapAction> =>
  TrapAction.create({
    tenantId,
    name: data.name.trim(),
    active: data.active !== false
  });

export const updateAction = async (
  tenantId: string | number,
  actionId: string,
  data: TrapCatalogData
): Promise<TrapAction> => {
  const action = await TrapAction.findOne({
    where: { id: actionId, tenantId }
  });
  if (!action) throw new AppError("ERR_TRAP_ACTION_NOT_FOUND", 404);
  await action.update({
    name: data.name.trim(),
    active: data.active !== false
  });
  return action;
};

const ensureInspectionCatalog = async (
  tenantId: string | number,
  conditionIds: number[] = [],
  actionIds: number[] = []
): Promise<void> => {
  const uniqueConditionIds = Array.from(
    new Set(conditionIds.map(Number).filter(Boolean))
  );
  const uniqueActionIds = Array.from(
    new Set(actionIds.map(Number).filter(Boolean))
  );
  const [conditions, actions] = await Promise.all([
    uniqueConditionIds.length
      ? TrapCondition.count({
          where: { tenantId, id: { [Op.in]: uniqueConditionIds }, active: true }
        })
      : 0,
    uniqueActionIds.length
      ? TrapAction.count({
          where: { tenantId, id: { [Op.in]: uniqueActionIds }, active: true }
        })
      : 0
  ]);
  if (conditions !== uniqueConditionIds.length) {
    throw new AppError("ERR_TRAP_CONDITION_NOT_FOUND", 404);
  }
  if (actions !== uniqueActionIds.length) {
    throw new AppError("ERR_TRAP_ACTION_NOT_FOUND", 404);
  }
};

export const listInspections = async (
  tenantId: string | number,
  filters: { monitoringPointId?: string } = {}
): Promise<TrapInspection[]> =>
  TrapInspection.findAll({
    where: {
      tenantId,
      ...(filters.monitoringPointId
        ? { monitoringPointId: filters.monitoringPointId }
        : {})
    },
    include: [
      { model: MonitoringPoint, as: "monitoringPoint", include: pointInclude },
      { model: User, as: "technician", attributes: ["id", "name"] },
      { model: TrapCondition, as: "conditions" },
      { model: TrapAction, as: "actions" }
    ],
    order: [["inspectionDate", "DESC"]]
  });

export const createInspection = async (
  tenantId: string | number,
  defaultTechnicianId: number,
  data: TrapInspectionData
): Promise<TrapInspection> => {
  const point = await MonitoringPoint.findOne({
    where: { id: data.monitoringPointId, tenantId }
  });
  if (!point) throw new AppError("ERR_MONITORING_POINT_NOT_FOUND", 404);
  const conditionIds = Array.from(
    new Set((data.conditionIds || []).map(Number).filter(Boolean))
  );
  const actionIds = Array.from(
    new Set((data.actionIds || []).map(Number).filter(Boolean))
  );
  await ensureInspectionCatalog(tenantId, conditionIds, actionIds);
  const inspection = await sequelize.transaction(async transaction => {
    const created = await TrapInspection.create(
      {
        tenantId,
        monitoringPointId: point.id,
        technicianId: data.technicianId || defaultTechnicianId,
        inspectionDate: data.inspectionDate || new Date(),
        notes: nullable(data.notes)
      },
      { transaction }
    );
    await Promise.all([
      conditionIds.length
        ? TrapInspectionCondition.bulkCreate(
            conditionIds.map(conditionId => ({
              tenantId,
              inspectionId: created.id,
              conditionId
            })),
            { transaction }
          )
        : Promise.resolve(),
      actionIds.length
        ? TrapInspectionAction.bulkCreate(
            actionIds.map(actionId => ({
              tenantId,
              inspectionId: created.id,
              actionId
            })),
            { transaction }
          )
        : Promise.resolve(),
      createHistory(tenantId, point, "inspection", transaction, data.notes, {
        areaId: point.areaId,
        sectorId: point.sectorId
      })
    ]);
    return created;
  });
  const loaded = await TrapInspection.findOne({
    where: { id: inspection.id, tenantId },
    include: [
      { model: MonitoringPoint, as: "monitoringPoint", include: pointInclude },
      { model: User, as: "technician", attributes: ["id", "name"] },
      { model: TrapCondition, as: "conditions" },
      { model: TrapAction, as: "actions" }
    ]
  });
  if (!loaded) throw new AppError("ERR_TRAP_INSPECTION_NOT_FOUND", 404);
  return loaded;
};

export const listFloorPlans = async (
  tenantId: string | number,
  filters: { clientId?: string; addressId?: string } = {}
): Promise<ClientFloorPlan[]> =>
  ClientFloorPlan.findAll({
    where: {
      tenantId,
      ...(filters.clientId ? { clientId: filters.clientId } : {}),
      ...(filters.addressId ? { addressId: filters.addressId } : {})
    },
    include: [
      { model: Client, as: "client", required: false },
      { model: ClientAddress, as: "address", required: false }
    ],
    order: [["name", "ASC"]]
  });

export const createFloorPlan = async (
  tenantId: string | number,
  data: FloorPlanData
): Promise<ClientFloorPlan> => {
  await ensureLocation(tenantId, data.clientId, data.addressId, 0, 0).catch(
    async error => {
      if (
        error instanceof AppError &&
        error.message === "ERR_CLIENT_AREA_NOT_FOUND"
      ) {
        return;
      }
      throw error;
    }
  );
  await ClientAddress.findOne({
    where: { id: data.addressId, clientId: data.clientId, tenantId }
  }).then(address => {
    if (!address) throw new AppError("ERR_CLIENT_ADDRESS_NOT_FOUND", 404);
  });
  return ClientFloorPlan.create({
    tenantId,
    clientId: data.clientId,
    addressId: data.addressId,
    name: data.name.trim(),
    fileUrl: data.fileUrl,
    fileType: data.fileType,
    originalFilename: data.originalFilename,
    notes: nullable(data.notes)
  });
};

export const updateFloorPlan = async (
  tenantId: string | number,
  floorPlanId: string,
  data: Partial<FloorPlanData>
): Promise<ClientFloorPlan> => {
  const floorPlan = await ClientFloorPlan.findOne({
    where: { id: floorPlanId, tenantId }
  });
  if (!floorPlan) throw new AppError("ERR_FLOOR_PLAN_NOT_FOUND", 404);
  await floorPlan.update({
    name: data.name?.trim() || floorPlan.name,
    notes: data.notes !== undefined ? nullable(data.notes) : floorPlan.notes
  });
  return floorPlan;
};

export const deleteFloorPlan = async (
  tenantId: string | number,
  floorPlanId: string
): Promise<void> => {
  const floorPlan = await ClientFloorPlan.findOne({
    where: { id: floorPlanId, tenantId }
  });
  if (!floorPlan) throw new AppError("ERR_FLOOR_PLAN_NOT_FOUND", 404);
  await sequelize.transaction(async transaction => {
    await MonitoringPoint.update(
      {
        floorPlanId: null,
        positionX: null,
        positionY: null,
        mapLabel: null,
        isPositioned: false
      },
      { where: { tenantId, floorPlanId }, transaction }
    );
    await floorPlan.destroy({ transaction });
  });
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

export const updatePointPosition = async (
  tenantId: string | number,
  pointId: string,
  data: PointPositionData
): Promise<MonitoringPoint> => {
  const point = await MonitoringPoint.findOne({
    where: { id: pointId, tenantId }
  });
  if (!point) throw new AppError("ERR_MONITORING_POINT_NOT_FOUND", 404);
  const floorPlan = await ensureFloorPlan(tenantId, data.floorPlanId);
  if (
    floorPlan.clientId !== point.clientId ||
    floorPlan.addressId !== point.addressId
  ) {
    throw new AppError("ERR_FLOOR_PLAN_LOCATION_MISMATCH", 400);
  }
  await point.update({
    floorPlanId: floorPlan.id,
    positionX: data.positionX,
    positionY: data.positionY,
    mapLabel: nullable(data.mapLabel) || point.label,
    isPositioned: true
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
