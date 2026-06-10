import AuditLog from "../models/AuditLog";
import User from "../models/User";
import { logger } from "../utils/logger";

interface AuditLogData {
  tenantId?: string | number | null;
  userId?: string | number | null;
  action: string;
  resource: string;
  resourceId?: string | number | null;
  ip?: string | null;
  userAgent?: string | null;
  metadata?: Record<string, unknown> | null;
}

const createAuditLog = async (data: AuditLogData): Promise<void> => {
  try {
    await AuditLog.create({
      tenantId: data.tenantId ? Number(data.tenantId) : null,
      userId: data.userId ? Number(data.userId) : null,
      action: data.action,
      resource: data.resource,
      resourceId: data.resourceId ? String(data.resourceId) : null,
      ip: data.ip || null,
      userAgent: data.userAgent || null,
      metadata: data.metadata || null
    });
  } catch (error) {
    logger.error(`Audit log failed: ${error}`);
  }
};

export const listAuditLogs = async ({
  tenantId,
  resource,
  limit = 100
}: {
  tenantId: string | number;
  resource?: string;
  limit?: number;
}): Promise<Array<Record<string, unknown>>> => {
  const safeLimit = Math.min(Math.max(Number(limit) || 100, 1), 200);
  const logs = await AuditLog.findAll({
    where: {
      tenantId,
      ...(resource ? { resource } : {})
    },
    order: [["createdAt", "DESC"]],
    limit: safeLimit
  });

  const userIds = Array.from(
    new Set(logs.map(log => log.userId).filter(Boolean))
  );
  const users = await User.findAll({
    where: { tenantId, id: userIds },
    attributes: ["id", "name", "email"]
  });
  const usersById = new Map(users.map(user => [user.id, user] as const));

  return logs.map(log => {
    const user = usersById.get(log.userId);
    return {
      id: log.id,
      tenantId: log.tenantId,
      userId: log.userId,
      action: log.action,
      resource: log.resource,
      resourceId: log.resourceId,
      ip: log.ip,
      metadata: log.metadata,
      createdAt: log.createdAt,
      user: user
        ? {
            id: user.id,
            name: user.name,
            email: user.email
          }
        : null
    };
  });
};

export default createAuditLog;
