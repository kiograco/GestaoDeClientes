import Tenant from "../../models/Tenant";
import User from "../../models/User";

interface Branding {
  name?: string;
  logoUrl?: string;
}

const ShowTenantBrandingService = async (email?: string): Promise<Branding> => {
  if (!email) return {};

  const user = await User.findOne({
    where: { email: email.trim().toLowerCase() },
    include: [{ model: Tenant, attributes: ["name", "logoUrl"] }]
  });

  if (!user?.tenant) return {};

  return {
    name: user.tenant.name,
    logoUrl: user.tenant.logoUrl
  };
};

export default ShowTenantBrandingService;
