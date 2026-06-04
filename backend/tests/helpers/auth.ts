import { sign } from "jsonwebtoken";
import authConfig from "../../src/config/auth";
import User from "../../src/models/User";

export const bearerTokenFor = (user: Pick<User, "id" | "email" | "profile" | "tenantId">): string => {
  const token = sign(
    {
      id: String(user.id),
      username: user.email,
      profile: user.profile,
      tenantId: user.tenantId
    },
    authConfig.secret,
    { expiresIn: "1h" }
  );

  return `Bearer ${token}`;
};
