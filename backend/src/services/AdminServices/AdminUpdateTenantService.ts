import * as Yup from "yup";
import AppError from "../../errors/AppError";
import Tenant from "../../models/Tenant";

interface Request {
  tenantId: string | number;
  status: string;
}

const AdminUpdateTenantService = async ({
  tenantId,
  status
}: Request): Promise<Tenant> => {
  const schema = Yup.object().shape({
    status: Yup.string().oneOf(["active", "inactive"]).required()
  });

  try {
    await schema.validate({ status });
  } catch (error) {
    throw new AppError(error.message);
  }

  const tenant = await Tenant.findByPk(tenantId);
  if (!tenant) {
    throw new AppError("ERR_NO_TENANT_FOUND", 404);
  }

  await tenant.update({ status });
  return tenant;
};

export default AdminUpdateTenantService;
