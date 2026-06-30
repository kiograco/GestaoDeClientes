import * as Yup from "yup";
import sequelize from "../../database";
import AppError from "../../errors/AppError";
import Setting from "../../models/Setting";
import Tenant from "../../models/Tenant";
import User from "../../models/User";
import { createTenantAccessExpiration } from "../../helpers/TenantAccess";

interface Request {
  name: string;
  cpfCnpj: string;
  adminName: string;
  adminEmail: string;
  adminPassword: string;
  maxUsers?: number;
  maxConnections?: number;
  paidDays?: number;
  businessType?: "generic" | "food_delivery";
}

const defaultSettings = [
  ["userCreation", "enabled"],
  ["NotViewTicketsQueueUndefined", "disabled"],
  ["NotViewTicketsChatBot", "disabled"],
  ["DirectTicketsToWallets", "disabled"],
  ["NotViewAssignedTickets", "disabled"],
  ["botTicketActive", ""],
  ["ignoreGroupMsg", "enabled"],
  ["rejectCalls", "disabled"],
  [
    "callRejectMessage",
    "As chamadas de voz e video estao desabilitadas. Envie uma mensagem de texto."
  ],
  ["newTicketTransference", "disabled"]
];

const AdminCreateTenantService = async (data: Request): Promise<Tenant> => {
  const schema = Yup.object().shape({
    name: Yup.string().trim().required().min(2),
    cpfCnpj: Yup.string()
      .transform(value => value?.replace(/\D/g, ""))
      .matches(/^(\d{11}|\d{14})$/, "CPF ou CNPJ invalido")
      .required(),
    adminName: Yup.string().trim().required().min(2),
    adminEmail: Yup.string().trim().email().required(),
    adminPassword: Yup.string().required().min(6),
    maxUsers: Yup.number().integer().positive(),
    maxConnections: Yup.number().integer().positive(),
    paidDays: Yup.number().integer().positive(),
    businessType: Yup.string().oneOf(["generic", "food_delivery"])
  });

  try {
    await schema.validate(data);
  } catch (error) {
    throw new AppError(error.message);
  }

  const adminEmail = data.adminEmail.trim().toLowerCase();
  const existingUser = await User.findOne({ where: { email: adminEmail } });
  if (existingUser) {
    throw new AppError("ERR_EMAIL_ALREADY_EXISTS", 400);
  }

  return sequelize.transaction(async transaction => {
    const tenant = await Tenant.create(
      {
        name: data.name.trim(),
        cpfCnpj: data.cpfCnpj.replace(/\D/g, ""),
        status: "active",
        accessExpiresAt: createTenantAccessExpiration(data.paidDays || 30),
        maxUsers: data.maxUsers || 10,
        maxConnections: data.maxConnections || 5,
        businessType: data.businessType || "generic",
        enabledModules: { delivery: data.businessType === "food_delivery" }
      } as LegacyAny,
      { transaction }
    );

    const owner = await User.create(
      {
        name: data.adminName.trim(),
        email: adminEmail,
        password: data.adminPassword,
        profile: "admin",
        tenantId: tenant.id,
        status: "offline",
        isOnline: false
      } as LegacyAny,
      { transaction }
    );

    await tenant.update({ ownerId: owner.id }, { transaction });
    await Setting.bulkCreate(
      defaultSettings.map(([key, value]) => ({
        key,
        value,
        tenantId: tenant.id
      })) as LegacyAny,
      { transaction }
    );

    return tenant;
  });
};

export default AdminCreateTenantService;
