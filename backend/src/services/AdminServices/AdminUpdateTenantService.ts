import * as Yup from "yup";
import AppError from "../../errors/AppError";
import sequelize from "../../database";
import Tenant from "../../models/Tenant";
import User from "../../models/User";
import { extendTenantAccessExpiration } from "../../helpers/TenantAccess";

interface Request {
  tenantId: string | number;
  status?: string;
  paidDays?: number;
  name?: string;
  cpfCnpj?: string;
  adminName?: string;
  adminEmail?: string;
  adminPassword?: string;
  maxUsers?: number;
  maxConnections?: number;
  businessType?: "generic" | "food_delivery";
}

const AdminUpdateTenantService = async (data: Request): Promise<Tenant> => {
  const {
    tenantId,
    status,
    paidDays,
    name,
    cpfCnpj,
    adminName,
    adminEmail,
    adminPassword,
    maxUsers,
    maxConnections,
    businessType
  } = data;
  const schema = Yup.object().shape({
    status: Yup.string().oneOf(["active", "inactive"]),
    paidDays: Yup.number().integer().positive(),
    name: Yup.string().trim().min(2),
    cpfCnpj: Yup.string()
      .transform(value => value?.replace(/\D/g, ""))
      .matches(/^(\d{11}|\d{14})$/, "CPF ou CNPJ invalido"),
    adminName: Yup.string().trim().min(2),
    adminEmail: Yup.string().trim().email(),
    adminPassword: Yup.string().min(6),
    maxUsers: Yup.number().integer().positive(),
    maxConnections: Yup.number().integer().positive(),
    businessType: Yup.string().oneOf(["generic", "food_delivery"])
  });

  try {
    await schema.validate(data);
  } catch (error) {
    throw new AppError(error.message);
  }

  const tenant = await Tenant.findByPk(tenantId);
  if (!tenant) {
    throw new AppError("ERR_NO_TENANT_FOUND", 404);
  }

  const hasTenantChanges =
    !!status ||
    !!paidDays ||
    name !== undefined ||
    cpfCnpj !== undefined ||
    maxUsers !== undefined ||
    maxConnections !== undefined ||
    businessType !== undefined;
  const hasOwnerChanges =
    adminName !== undefined ||
    adminEmail !== undefined ||
    adminPassword !== undefined;
  if (!hasTenantChanges && !hasOwnerChanges) {
    throw new AppError("ERR_TENANT_UPDATE_REQUIRED", 400);
  }

  const owner = await User.findByPk(tenant.ownerId);
  if (hasOwnerChanges && !owner) {
    throw new AppError("ERR_NO_USER_FOUND", 404);
  }

  const normalizedAdminEmail = adminEmail?.trim().toLowerCase();
  if (normalizedAdminEmail && normalizedAdminEmail !== owner?.email) {
    const existingUser = await User.findOne({
      where: { email: normalizedAdminEmail }
    });
    if (existingUser) {
      throw new AppError("ERR_EMAIL_ALREADY_EXISTS", 400);
    }
  }

  await sequelize.transaction(async transaction => {
    await tenant.update(
      {
        ...(status ? { status } : {}),
        ...(name !== undefined ? { name: name.trim() } : {}),
        ...(cpfCnpj !== undefined
          ? { cpfCnpj: cpfCnpj.replace(/\D/g, "") }
          : {}),
        ...(maxUsers !== undefined ? { maxUsers } : {}),
        ...(maxConnections !== undefined ? { maxConnections } : {}),
        ...(businessType !== undefined
          ? {
              businessType,
              enabledModules: { delivery: businessType === "food_delivery" }
            }
          : {}),
        ...(paidDays
          ? {
              status: "active",
              accessExpiresAt: extendTenantAccessExpiration(
                tenant.accessExpiresAt,
                paidDays
              )
            }
          : {})
      },
      { transaction }
    );

    if (owner && hasOwnerChanges) {
      await owner.update(
        {
          ...(adminName !== undefined ? { name: adminName.trim() } : {}),
          ...(normalizedAdminEmail ? { email: normalizedAdminEmail } : {}),
          ...(adminPassword ? { password: adminPassword } : {})
        },
        { transaction }
      );
    }
  });

  const updatedTenant = await Tenant.findByPk(tenant.id, {
    include: [
      {
        model: User,
        as: "owner",
        attributes: ["id", "name", "email"]
      }
    ]
  });

  return updatedTenant as Tenant;
};

export default AdminUpdateTenantService;
