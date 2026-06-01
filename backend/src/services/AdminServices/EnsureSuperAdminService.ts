import Tenant from "../../models/Tenant";
import User from "../../models/User";
import { logger } from "../../utils/logger";

const EnsureSuperAdminService = async (): Promise<void> => {
  const email = process.env.SUPERADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.SUPERADMIN_PASSWORD;

  if (!email || !password) {
    logger.warn("SUPERADMIN_EMAIL and SUPERADMIN_PASSWORD are not configured");
    return;
  }

  const existingUser = await User.findOne({ where: { email } });
  if (existingUser) {
    if (existingUser.profile !== "superadmin") {
      await existingUser.update({ profile: "superadmin" });
    }
    return;
  }

  const tenant = await Tenant.findOne({ order: [["id", "ASC"]] });
  if (!tenant) {
    logger.warn("Super admin was not created because no tenant exists yet");
    return;
  }

  await User.create({
    name: "Super Administrador",
    email,
    password,
    profile: "superadmin",
    tenantId: tenant.id,
    status: "offline",
    isOnline: false
  });
  logger.info("Super admin account created");
};

export default EnsureSuperAdminService;
