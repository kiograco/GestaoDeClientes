import { subDays } from "date-fns";
import { Op } from "sequelize";
import AuditLog from "../models/AuditLog";
import PaymentWebhookEvent from "../models/PaymentWebhookEvent";

interface RetentionResult {
  auditLogsDeleted: number;
  webhookPayloadsMinimized: number;
}

const numberFromEnv = (name: string, fallback: number): number => {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && value > 0 ? value : fallback;
};

const PrivacyRetentionService = async (): Promise<RetentionResult> => {
  const auditRetentionDays = numberFromEnv("AUDIT_LOG_RETENTION_DAYS", 365);
  const webhookPayloadRetentionDays = numberFromEnv(
    "WEBHOOK_PAYLOAD_RETENTION_DAYS",
    90
  );

  const auditLogsDeleted = await AuditLog.destroy({
    where: {
      createdAt: { [Op.lt]: subDays(new Date(), auditRetentionDays) }
    }
  });

  const [webhookPayloadsMinimized] = await PaymentWebhookEvent.update(
    { rawPayload: null },
    {
      where: {
        rawPayload: { [Op.ne]: null } as LegacyAny,
        createdAt: { [Op.lt]: subDays(new Date(), webhookPayloadRetentionDays) }
      }
    }
  );

  return { auditLogsDeleted, webhookPayloadsMinimized };
};

export default PrivacyRetentionService;
