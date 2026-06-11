import { Op, Transaction } from "sequelize";
import PDFDocument from "pdfkit";
import sequelize from "../../database";
import AppError from "../../errors/AppError";
import Contact from "../../models/Contact";
import SalesOpportunity from "../../models/SalesOpportunity";
import SalesOpportunityLog from "../../models/SalesOpportunityLog";
import SalesProposal from "../../models/SalesProposal";
import ServiceOrder from "../../models/ServiceOrder";
import ServiceOrderItem from "../../models/ServiceOrderItem";
import Tenant from "../../models/Tenant";
import User from "../../models/User";

export const SALES_PIPELINE_STAGES = [
  "novo",
  "contato_feito",
  "proposta_enviada",
  "negociacao",
  "ganho",
  "perdido"
];

export const SALES_PROPOSAL_STATUSES = [
  "rascunho",
  "enviada",
  "aprovada",
  "rejeitada",
  "convertida"
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

export interface SalesProposalItemData {
  description: string;
  quantity: number;
  unitPrice: number;
}

export interface SalesProposalData {
  title: string;
  introduction?: string | null;
  status?: string;
  validUntil?: string | Date | null;
  items: SalesProposalItemData[];
  discount?: number | null;
  observation?: string | null;
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

const formatCurrency = (value?: number | string | null): string =>
  Number(value || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });

const formatDate = (value?: Date | string | null): string =>
  value ? new Date(value).toLocaleDateString("pt-BR") : "-";

const ensureStage = (stage?: string): string => {
  const safeStage = stage || "novo";
  if (!SALES_PIPELINE_STAGES.includes(safeStage)) {
    throw new AppError("ERR_INVALID_SALES_PIPELINE_STAGE", 400);
  }
  return safeStage;
};

const ensureProposalStatus = (status?: string): string => {
  const safeStatus = status || "rascunho";
  if (!SALES_PROPOSAL_STATUSES.includes(safeStatus)) {
    throw new AppError("ERR_INVALID_SALES_PROPOSAL_STATUS", 400);
  }
  return safeStatus;
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

const normalizeProposalItems = (
  items: SalesProposalItemData[] = []
): Array<Record<string, unknown>> => {
  const normalized = items
    .filter(item => cleanText(item.description))
    .map(item => {
      const quantity = Math.max(1, Number(item.quantity || 1));
      const unitPrice = normalizeMoney(item.unitPrice);
      return {
        description: cleanText(item.description),
        quantity,
        unitPrice,
        totalPrice: Number((quantity * unitPrice).toFixed(2))
      };
    });
  if (!normalized.length) throw new AppError("ERR_PROPOSAL_ITEMS_REQUIRED", 400);
  return normalized;
};

const buildProposalPayload = (
  tenantId: string | number,
  opportunity: SalesOpportunity,
  userId: string | number,
  data: SalesProposalData
): Record<string, unknown> => {
  const items = normalizeProposalItems(data.items);
  const subtotal = Number(
    items
      .reduce((sum, item) => sum + Number(item.totalPrice || 0), 0)
      .toFixed(2)
  );
  const discount = Math.min(normalizeMoney(data.discount), subtotal);
  return {
    tenantId,
    salesOpportunityId: opportunity.id,
    contactId: opportunity.contactId,
    createdByUserId: Number(userId),
    title: cleanText(data.title),
    introduction: cleanText(data.introduction),
    status: ensureProposalStatus(data.status),
    validUntil: normalizeDate(data.validUntil),
    items,
    subtotal,
    discount,
    total: Number((subtotal - discount).toFixed(2)),
    observation: cleanText(data.observation)
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

const loadProposal = async (
  tenantId: string | number,
  proposalId: string | number
): Promise<SalesProposal> => {
  const proposal = await SalesProposal.findOne({
    where: { id: proposalId, tenantId },
    include: [
      { model: Contact, attributes: ["id", "name", "number", "email"] },
      { model: SalesOpportunity },
      { model: User, as: "createdBy", attributes: ["id", "name", "email"] },
      {
        model: ServiceOrder,
        attributes: ["id", "title", "status"],
        required: false
      }
    ]
  });
  if (!proposal) throw new AppError("ERR_SALES_PROPOSAL_NOT_FOUND", 404);
  return proposal;
};

export const listProposals = async (
  tenantId: string | number,
  opportunityId: string
): Promise<SalesProposal[]> => {
  await loadOpportunity(tenantId, opportunityId);
  return SalesProposal.findAll({
    where: { tenantId, salesOpportunityId: opportunityId },
    include: [
      { model: Contact, attributes: ["id", "name", "number", "email"] },
      {
        model: ServiceOrder,
        attributes: ["id", "title", "status"],
        required: false
      }
    ],
    order: [["createdAt", "DESC"]]
  });
};

export const createProposal = async (
  tenantId: string | number,
  userId: string | number,
  opportunityId: string,
  data: SalesProposalData
): Promise<SalesProposal> => {
  const created = await sequelize.transaction(async transaction => {
    const opportunity = await SalesOpportunity.findOne({
      where: { id: opportunityId, tenantId },
      transaction,
      lock: transaction.LOCK.UPDATE
    });
    if (!opportunity) {
      throw new AppError("ERR_SALES_OPPORTUNITY_NOT_FOUND", 404);
    }
    const proposal = await SalesProposal.create(
      buildProposalPayload(tenantId, opportunity, userId, data),
      { transaction }
    );
    await opportunity.update(
      { stage: "proposta_enviada", estimatedValue: proposal.total },
      { transaction }
    );
    await logOpportunity(
      opportunity.id,
      userId,
      "proposal_created",
      "Proposta criada para a oportunidade",
      null,
      { proposalId: proposal.id, total: proposal.total },
      transaction
    );
    return proposal;
  });
  return loadProposal(tenantId, created.id);
};

export const updateProposal = async (
  tenantId: string | number,
  userId: string | number,
  proposalId: string,
  data: SalesProposalData
): Promise<SalesProposal> => {
  await sequelize.transaction(async transaction => {
    const proposal = await SalesProposal.findOne({
      where: { id: proposalId, tenantId },
      include: [{ model: SalesOpportunity }],
      transaction,
      lock: transaction.LOCK.UPDATE
    });
    if (!proposal) throw new AppError("ERR_SALES_PROPOSAL_NOT_FOUND", 404);
    if (proposal.convertedServiceOrderId) {
      throw new AppError("ERR_SALES_PROPOSAL_ALREADY_CONVERTED", 409);
    }
    const opportunity = proposal.salesOpportunity;
    const oldValue = {
      status: proposal.status,
      total: proposal.total
    };
    await proposal.update(
      buildProposalPayload(tenantId, opportunity, userId, data),
      { transaction }
    );
    await logOpportunity(
      proposal.salesOpportunityId,
      userId,
      "proposal_updated",
      "Proposta atualizada",
      oldValue,
      {
        proposalId: proposal.id,
        status: proposal.status,
        total: proposal.total
      },
      transaction
    );
  });
  return loadProposal(tenantId, proposalId);
};

export const generateProposalDocument = async (
  tenantId: string | number,
  proposalId: string
): Promise<Buffer> => {
  const proposal = await loadProposal(tenantId, proposalId);
  const tenant = await Tenant.findByPk(tenantId);
  const doc = new PDFDocument({ margin: 36, size: "A4" });
  const chunks: Buffer[] = [];
  doc.on("data", chunk => chunks.push(chunk));
  const done = new Promise<Buffer>(resolve => {
    doc.on("end", () => resolve(Buffer.concat(chunks)));
  });

  const margin = 36;
  const width = doc.page.width - margin * 2;
  doc.fontSize(18).fillColor("#111827").text("Proposta Comercial", margin, 36);
  doc
    .fontSize(10)
    .fillColor("#4b5563")
    .text(tenant?.name || "Empresa", margin, 62)
    .text(`Proposta #${proposal.id}`, margin, 78)
    .text(`Validade: ${formatDate(proposal.validUntil)}`, margin, 94);

  doc
    .moveTo(margin, 118)
    .lineTo(doc.page.width - margin, 118)
    .strokeColor("#d1d5db")
    .stroke();

  doc.fontSize(11).fillColor("#111827");
  doc.text(`Cliente: ${proposal.contact?.name || "-"}`, margin, 134);
  doc.text(
    `Contato: ${proposal.contact?.number || proposal.contact?.email || "-"}`,
    margin,
    150
  );
  doc.text(`Titulo: ${proposal.title}`, margin, 166);

  let y = 196;
  if (proposal.introduction) {
    doc.fontSize(10).fillColor("#374151").text(proposal.introduction, margin, y, {
      width,
      lineGap: 2
    });
    y = doc.y + 18;
  }

  doc.fontSize(10).fillColor("#111827").text("Itens", margin, y);
  y += 18;
  doc
    .fontSize(9)
    .fillColor("#374151")
    .text("Descricao", margin, y, { width: 260 })
    .text("Qtd.", margin + 270, y, { width: 50, align: "right" })
    .text("Unitario", margin + 330, y, { width: 80, align: "right" })
    .text("Total", margin + 420, y, { width: 90, align: "right" });
  y += 14;
  (proposal.items || []).forEach(item => {
    doc
      .fontSize(9)
      .text(String(item.description || "-"), margin, y, { width: 260 })
      .text(String(item.quantity || 0), margin + 270, y, {
        width: 50,
        align: "right"
      })
      .text(formatCurrency(Number(item.unitPrice || 0)), margin + 330, y, {
        width: 80,
        align: "right"
      })
      .text(formatCurrency(Number(item.totalPrice || 0)), margin + 420, y, {
        width: 90,
        align: "right"
      });
    y += 18;
  });

  y += 10;
  doc
    .fontSize(10)
    .fillColor("#111827")
    .text(`Subtotal: ${formatCurrency(proposal.subtotal)}`, margin + 330, y, {
      width: 180,
      align: "right"
    })
    .text(
      `Desconto: ${formatCurrency(proposal.discount)}`,
      margin + 330,
      y + 16,
      {
        width: 180,
        align: "right"
      }
    )
    .fontSize(12)
    .text(`Total: ${formatCurrency(proposal.total)}`, margin + 330, y + 34, {
      width: 180,
      align: "right"
    });

  if (proposal.observation) {
    doc.fontSize(9).fillColor("#374151").text("Observacoes", margin, y + 70);
    doc.text(proposal.observation, margin, y + 86, { width });
  }
  doc
    .fontSize(8)
    .fillColor("#6b7280")
    .text(
      `Documento gerado em ${new Date().toLocaleString("pt-BR")}`,
      margin,
      780,
      {
        width,
        align: "center"
      }
    );
  doc.end();
  return done;
};

export const convertProposalToServiceOrder = async (
  tenantId: string | number,
  userId: string | number,
  proposalId: string,
  data: ConvertOpportunityData
): Promise<ServiceOrder> => {
  const serviceOrder = await sequelize.transaction(async transaction => {
    const proposal = await SalesProposal.findOne({
      where: { id: proposalId, tenantId },
      include: [{ model: SalesOpportunity }],
      transaction,
      lock: transaction.LOCK.UPDATE
    });
    if (!proposal) throw new AppError("ERR_SALES_PROPOSAL_NOT_FOUND", 404);
    if (proposal.convertedServiceOrderId) {
      throw new AppError("ERR_SALES_PROPOSAL_ALREADY_CONVERTED", 409);
    }
    const opportunity = proposal.salesOpportunity;
    const oldValue = {
      stage: opportunity.stage,
      proposalStatus: proposal.status
    };
    const order = await ServiceOrder.create(
      {
        tenantId,
        contactId: proposal.contactId,
        attendantId: null,
        createdByUserId: Number(userId),
        title: proposal.title,
        description: proposal.introduction || opportunity.description,
        serviceType: cleanText(data.serviceType) || proposal.title,
        priority: "media",
        status: data.scheduledStart ? "agendada" : "rascunho",
        financialStatus: "nao_cobrado",
        chargedAmount: proposal.total || 0,
        paidAmount: 0,
        scheduledStart: normalizeDate(data.scheduledStart),
        scheduledEnd: normalizeDate(data.scheduledEnd),
        address: cleanText(data.address),
        city: cleanText(data.city),
        state: cleanText(data.state)?.toUpperCase() || null,
        publicObservation: cleanText(data.publicObservation),
        internalObservation:
          cleanText(data.internalObservation) ||
          `Gerada pela proposta #${proposal.id}`
      },
      { transaction }
    );
    await ServiceOrderItem.bulkCreate(
      (proposal.items || []).map(item => ({
        tenantId,
        serviceOrderId: order.id,
        itemType: "service",
        serviceTypeId: null,
        inventoryItemId: null,
        description: String(item.description || "Servico"),
        quantity: Math.max(1, Number(item.quantity || 1)),
        unitPrice: normalizeMoney(String(item.unitPrice || 0)),
        totalPrice: normalizeMoney(String(item.totalPrice || 0))
      })),
      { transaction }
    );
    await proposal.update(
      {
        status: "convertida",
        convertedAt: new Date(),
        convertedServiceOrderId: order.id
      },
      { transaction }
    );
    await opportunity.update(
      {
        stage: "ganho",
        wonAt: new Date(),
        estimatedValue: proposal.total,
        convertedServiceOrderId: order.id
      },
      { transaction }
    );
    await logOpportunity(
      opportunity.id,
      userId,
      "proposal_converted_to_service_order",
      "Proposta convertida em ordem de servico",
      oldValue,
      { stage: "ganho", proposalId: proposal.id, serviceOrderId: order.id },
      transaction
    );
    return order;
  });
  return serviceOrder;
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
