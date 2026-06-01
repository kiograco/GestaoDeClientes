import sequelize from "../../database";
import Payment from "../../models/Payment";
import Subscription from "../../models/Subscription";
import Tenant from "../../models/Tenant";
import { extendTenantAccessExpiration } from "../../helpers/TenantAccess";

const RenewCompanyAccessService = async (
  companyId: number,
  durationDays: number,
  paymentId: number,
  limits?: { maxUsers?: number; maxConnections?: number }
): Promise<void> => {
  await sequelize.transaction(async transaction => {
    const payment = await Payment.findByPk(paymentId, {
      transaction,
      lock: transaction.LOCK.UPDATE
    });
    if (!payment || payment.renewalAppliedAt) return;

    const tenant = await Tenant.findByPk(companyId, {
      transaction,
      lock: transaction.LOCK.UPDATE
    });
    if (!tenant) return;

    const renewedAt = new Date();
    const accessExpiresAt = extendTenantAccessExpiration(
      tenant.accessExpiresAt,
      durationDays
    );
    await tenant.update(
      {
        status: "active",
        accessExpiresAt,
        ...(limits?.maxUsers ? { maxUsers: limits.maxUsers } : {}),
        ...(limits?.maxConnections
          ? { maxConnections: limits.maxConnections }
          : {})
      },
      { transaction }
    );
    await payment.update(
      { status: "RECEIVED", renewalAppliedAt: renewedAt },
      { transaction }
    );
    await Subscription.update(
      {
        status: "active",
        currentPeriodStart: renewedAt,
        currentPeriodEnd: accessExpiresAt
      },
      { where: { id: payment.subscriptionId }, transaction }
    );
  });
};

export default RenewCompanyAccessService;
