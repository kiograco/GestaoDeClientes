import AuditLog from "../models/AuditLog";
import { logger } from "../utils/logger";

interface AuditLogData {
  tenantId?: string | number | null;
  userId?: string | number | null;
  action: string;
  resource: string;
  resourceId?: string | number | null;
  ip?: string | null;
  userAgent?: string | null;
  metadata?: object | null;
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

export default createAuditLog;
