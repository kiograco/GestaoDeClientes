import { Op, Transaction } from "sequelize";
import sequelize from "../../database";
import AppError from "../../errors/AppError";
import Contact from "../../models/Contact";
import SalesOpportunity from "../../models/SalesOpportunity";
import SalesOpportunityLog from "../../models/SalesOpportunityLog";
import ServiceOrder from "../../models/ServiceOrder";
import User from "../../models/User";

export const SALES_PIPELINE_STAGES = [
  "novo",
  "contato_feito",
  "proposta_enviada",
  "negociacao",
  "ganho",
  "perdido"
];

export interface SalesOpportunityData {
  contactId: number;
  ownerUserId?: number | null;
  title: string;
  description?: string | null;
  stage?: string;
  estimatedValue?: number | null;
  expectedCloseDate?: string | Date | null;
  source?: string | null;
  lostReason?: string | null;
  notes?: string | null;
}

export interface ConvertOpportunityData {
  serviceType?: string | null;
  scheduledStart?: string | Date | null;
  scheduledEnd?: string | Date | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  publicObservation?: string | null;
  internalObservation?: string | null;
}

const includeOpportunity = [
  { model: Contact, attributes: ["id", "name", "number", "email"] },
  { model: User, as: "owner", attributes: ["id", "name", "email"] },
  {
    model: ServiceOrder,
    attributes: ["id", "title", "status"],
    required: false
  },
  {
    model: SalesOpportunityLog,
    as: "logs",
    include: [{ model: User, attributes: ["id", "name", "email"] }],
    required: false
  }
];

const cleanText = (value?: string | null): string | null =>
  value === undefined || value === null ? null : String(value).trim() || null;

const normalizeMoney = (value?: number | string | null): number => {
  if (value === undefined || value === null || value === "") return 0;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? Number(parsed.toFixed(2)) : 0;
};

const normalizeDate = (value?: string | Date | null): Date | null => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const ensureStage = (stage?: string): string => {
  const safeStage = stage || "novo";
  if (!SALES_PIPELINE_STAGES.includes(safeStage)) {
    throw new AppError("ERR_INVALID_SALES_PIPELINE_STAGE", 400);
  }
  return safeStage;
};

const ensureContact = async (
  tenantId: string | number,
  contactId: number,
  transaction?: Transaction
): Promise<void> => {
  const contact = await Contact.findOne({
    where: { id: contactId, tenantId },
    transaction
  });
  if (!contact) throw new AppError("ERR_NO_CONTACT_FOUND", 404);
};

const ensureOwner = async (
  tenantId: string | number,
  ownerUserId?: number | null,
  transaction?: Transaction
): Promise<void> => {
  if (!ownerUserId) return;
  const owner = await User.findOne({
    where: { id: ownerUserId, tenantId },
    transaction
  });
  if (!owner) throw new AppError("ERR_USER_NOT_FOUND", 404);
};

const stageDates = (stage: string): Record<string, Date | null> => ({
  wonAt: stage === "ganho" ? new Date() : null,
  lostAt: stage === "perdido" ? new Date() : null
});

const buildOpportunityPayload = (
  tenantId: string | number,
  data: SalesOpportunityData
): Record<string, unknown> => {
  const stage = ensureStage(data.stage);
  return {
    tenantId,
    contactId: data.contactId,
    ownerUserId: data.ownerUserId || null,
    title: cleanText(data.title),
    description: cleanText(data.description),
    stage,
    estimatedValue: normalizeMoney(data.estimatedValue),
    expectedCloseDate: normalizeDate(data.expectedCloseDate),
    source: cleanText(data.source),
    lostReason: stage === "perdido" ? cleanText(data.lostReason) : null,
    notes: cleanText(data.notes),
    ...stageDates(stage)
  };
};

const logOpportunity = async (
  salesOpportunityId: number,
  userId: string | number,
  action: string,
  description: string,
  oldValue: Record<string, unknown> | null,
  newValue: Record<string, unknown> | null,
  transaction?: Transaction
): Promise<void> => {
  await SalesOpportunityLog.create(
    {
      salesOpportunityId,
      userId: Number(userId),
      action,
      description,
      oldValue,
      newValue
    },
    { transaction }
  );
};

const loadOpportunity = async (
  tenantId: string | number,
  opportunityId: string | number
): Promise<SalesOpportunity> => {
  const opportunity = await SalesOpportunity.findOne({
    where: { id: opportunityId, tenantId },
    include: includeOpportunity,
    order: [[{ model: SalesOpportunityLog, as: "logs" }, "createdAt", "DESC"]]
  });
  if (!opportunity) throw new AppError("ERR_SALES_OPPORTUNITY_NOT_FOUND", 404);
  return opportunity;
};

export const listOpportunities = async (
  tenantId: string | number,
  filters: LegacyAny
): Promise<SalesOpportunity[]> => {
  const search = String(filters.search || "").trim();
  const where: LegacyAny = {
    tenantId,
    ...(filters.stage ? { stage: filters.stage } : {}),
    ...(filters.ownerUserId ? { ownerUserId: filters.ownerUserId } : {})
  };
  if (filters.start && filters.end) {
    where.expectedCloseDate = {
      [Op.between]: [new Date(filters.start), new Date(filters.end)]
    };
  }
  if (search) {
    where[Op.or] = [
      { title: { [Op.iLike]: `%${search}%` } },
      { source: { [Op.iLike]: `%${search}%` } },
      { "$contact.name$": { [Op.iLike]: `%${search}%` } },
      { "$contact.email$": { [Op.iLike]: `%${search}%` } }
    ];
  }
  return SalesOpportunity.findAll({
    where,
    include: includeOpportunity,
    order: [
      ["stage", "ASC"],
      ["expectedCloseDate", "ASC"],
      ["updatedAt", "DESC"]
    ]
  });
};

export const getDashboard = async (
  tenantId: string | number
): Promise<Record<string, unknown>> => {
  const opportunities = await SalesOpportunity.findAll({
    where: { tenantId },
    include: [
      { model: Contact, attributes: ["id", "name"] },
      { model: User, as: "owner", attributes: ["id", "name"] }
    ]
  });
  const total = opportunities.length;
  const won = opportunities.filter(item => item.stage === "ganho");
  const lost = opportunities.filter(item => item.stage === "perdido");
  const open = opportunities.filter(
    item => !["ganho", "perdido"].includes(item.stage)
  );
  const byStage = SALES_PIPELINE_STAGES.reduce((acc, stage) => {
    const items = opportunities.filter(item => item.stage === stage);
    acc[stage] = {
      count: items.length,
      value: Number(
        items
          .reduce((sum, item) => sum + Number(item.estimatedValue || 0), 0)
          .toFixed(2)
      )
    };
    return acc;
  }, {} as Record<string, { count: number; value: number }>);
  const valueByOwner = opportunities.reduce((acc, item) => {
    const key = item.owner?.name || "Sem responsavel";
    acc[key] = Number(
      ((acc[key] || 0) + Number(item.estimatedValue || 0)).toFixed(2)
    );
    return acc;
  }, {} as Record<string, number>);

  return {
    total,
    open: open.length,
    won: won.length,
    lost: lost.length,
    openValue: Number(
      open
        .reduce((sum, item) => sum + Number(item.estimatedValue || 0), 0)
        .toFixed(2)
    ),
    wonValue: Number(
      won
        .reduce((sum, item) => sum + Number(item.estimatedValue || 0), 0)
        .toFixed(2)
    ),
    conversionRate: total ? Number(((won.length / total) * 100).toFixed(2)) : 0,
    byStage,
    valueByOwner
  };
};

export const showOpportunity = (
  tenantId: string | number,
  opportunityId: string
): Promise<SalesOpportunity> => loadOpportunity(tenantId, opportunityId);

export const createOpportunity = async (
  tenantId: string | number,
  userId: string | number,
  data: SalesOpportunityData
): Promise<SalesOpportunity> => {
  const created = await sequelize.transaction(async transaction => {
    await ensureContact(tenantId, data.contactId, transaction);
    await ensureOwner(tenantId, data.ownerUserId, transaction);
    const opportunity = await SalesOpportunity.create(
      buildOpportunityPayload(tenantId, data),
      { transaction }
    );
    await logOpportunity(
      opportunity.id,
      userId,
      "created",
      "Oportunidade criada",
      null,
      { stage: opportunity.stage, estimatedValue: opportunity.estimatedValue },
      transaction
    );
    return opportunity;
  });
  return loadOpportunity(tenantId, created.id);
};

export const updateOpportunity = async (
  tenantId: string | number,
  userId: string | number,
  opportunityId: string,
  data: SalesOpportunityData
): Promise<SalesOpportunity> => {
  await sequelize.transaction(async transaction => {
    const opportunity = await SalesOpportunity.findOne({
      where: { id: opportunityId, tenantId },
      transaction,
      lock: transaction.LOCK.UPDATE
    });
    if (!opportunity) {
      throw new AppError("ERR_SALES_OPPORTUNITY_NOT_FOUND", 404);
    }
    await ensureContact(tenantId, data.contactId, transaction);
    await ensureOwner(tenantId, data.ownerUserId, transaction);
    const oldValue = {
      stage: opportunity.stage,
      estimatedValue: opportunity.estimatedValue,
      ownerUserId: opportunity.ownerUserId
    };
    const payload = buildOpportunityPayload(tenantId, data);
    await opportunity.update(payload, { transaction });
    await logOpportunity(
      opportunity.id,
      userId,
      payload.stage !== oldValue.stage ? "stage_changed" : "updated",
      "Oportunidade atualizada",
      oldValue,
      {
        stage: opportunity.stage,
        estimatedValue: opportunity.estimatedValue,
        ownerUserId: opportunity.ownerUserId
      },
      transaction
    );
  });
  return loadOpportunity(tenantId, opportunityId);
};

export const convertOpportunityToServiceOrder = async (
  tenantId: string | number,
  userId: string | number,
  opportunityId: string,
  data: ConvertOpportunityData
): Promise<ServiceOrder> => {
  const serviceOrder = await sequelize.transaction(async transaction => {
    const opportunity = await SalesOpportunity.findOne({
      where: { id: opportunityId, tenantId },
      transaction,
      lock: transaction.LOCK.UPDATE
    });
    if (!opportunity) {
      throw new AppError("ERR_SALES_OPPORTUNITY_NOT_FOUND", 404);
    }
    if (opportunity.convertedServiceOrderId) {
      throw new AppError("ERR_SALES_OPPORTUNITY_ALREADY_CONVERTED", 409);
    }
    const order = await ServiceOrder.create(
      {
        tenantId,
        contactId: opportunity.contactId,
        attendantId: null,
        createdByUserId: Number(userId),
        title: opportunity.title,
        description: opportunity.description,
        serviceType: cleanText(data.serviceType) || opportunity.title,
        priority: "media",
        status: data.scheduledStart ? "agendada" : "rascunho",
        financialStatus: "nao_cobrado",
        chargedAmount: opportunity.estimatedValue || 0,
        paidAmount: 0,
        scheduledStart: normalizeDate(data.scheduledStart),
        scheduledEnd: normalizeDate(data.scheduledEnd),
        address: cleanText(data.address),
        city: cleanText(data.city),
        state: cleanText(data.state)?.toUpperCase() || null,
        publicObservation: cleanText(data.publicObservation),
        internalObservation:
          cleanText(data.internalObservation) ||
          `Gerada pela oportunidade #${opportunity.id}`
      },
      { transaction }
    );
    await opportunity.update(
      {
        stage: "ganho",
        wonAt: new Date(),
        convertedServiceOrderId: order.id
      },
      { transaction }
    );
    await logOpportunity(
      opportunity.id,
      userId,
      "converted_to_service_order",
      "Oportunidade convertida em ordem de servico",
      { stage: opportunity.stage },
      { stage: "ganho", serviceOrderId: order.id },
      transaction
    );
    return order;
  });
  return serviceOrder;
};
