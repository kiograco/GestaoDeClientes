import AppError from "../errors/AppError";
import Tenant from "../models/Tenant";

const EnsureDeliveryModule = async (
  tenantId: string | number
): Promise<Tenant> => {
  const tenant = await Tenant.findByPk(tenantId, {
    attributes: ["id", "businessType", "enabledModules"]
  });

  if (!tenant || !tenant.enabledModules?.delivery) {
    throw new AppError("ERR_DELIVERY_MODULE_DISABLED", 403);
  }

  return tenant;
};

export default EnsureDeliveryModule;
