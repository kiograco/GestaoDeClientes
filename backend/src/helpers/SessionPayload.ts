import User from "../models/User";
import {
  getTenantAccessDaysRemaining,
  isTenantAccessActive
} from "./TenantAccess";

const buildSessionPayload = (
  user: User,
  token: string
): Record<string, unknown> => ({
  token,
  username: user.name,
  email: user.email,
  profile: user.profile,
  status: user.status,
  userId: user.id,
  tenantId: user.tenantId,
  tenantName: user.tenant?.name,
  logoUrl: user.tenant?.logoUrl,
  accessExpiresAt: user.tenant?.accessExpiresAt,
  businessType: user.tenant?.businessType,
  enabledModules: user.tenant?.enabledModules,
  accessDaysRemaining: getTenantAccessDaysRemaining(
    user.tenant?.accessExpiresAt
  ),
  subscriptionExpired:
    user.profile !== "superadmin" && !isTenantAccessActive(user.tenant),
  queues: user.queues,
  configs: user.configs
});

export default buildSessionPayload;
