import Tenant from "../../models/Tenant";
import User from "../../models/User";

const AdminListTenantsService = async (): Promise<Tenant[]> => {
  const tenants = await Tenant.findAll({
    include: [
      {
        model: User,
        as: "owner",
        attributes: ["id", "name", "email"]
      }
    ],
    order: [["name", "ASC"]]
  });

  return tenants;
};

export default AdminListTenantsService;
