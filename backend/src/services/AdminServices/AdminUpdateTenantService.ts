import * as Yup from "yup";
import AppError from "../../errors/AppError";
import Tenant from "../../models/Tenant";
import { extendTenantAccessExpiration } from "../../helpers/TenantAccess";

interface Request {
  tenantId: string | number;
  status?: string;
  paidDays?: number;
}

const AdminUpdateTenantService = async ({
  tenantId,
  status,
  paidDays
}: Request): Promise<Tenant> => {
  const schema = Yup.object().shape({
    status: Yup.string().oneOf(["active", "inactive"]),
    paidDays: Yup.number().integer().positive()
  });

  try {
    await schema.validate({ status, paidDays });
  } catch (error) {
    throw new AppError(error.message);
  }

  const tenant = await Tenant.findByPk(tenantId);
  if (!tenant) {
    throw new AppError("ERR_NO_TENANT_FOUND", 404);
  }

  if (!status && !paidDays) {
    throw new AppError("ERR_TENANT_UPDATE_REQUIRED", 400);
  }

  await tenant.update({
    ...(status ? { status } : {}),
    ...(paidDays
      ? {
          status: "active",
          accessExpiresAt: extendTenantAccessExpiration(
            tenant.accessExpiresAt,
            paidDays
          )
        }
      : {})
  });
  return tenant;
};

export default AdminUpdateTenantService;
