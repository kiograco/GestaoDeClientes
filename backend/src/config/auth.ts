const secret = process.env.JWT_SECRET;
const refreshSecret = process.env.JWT_REFRESH_SECRET;

if (!secret || !refreshSecret) {
  throw new Error("JWT_SECRET and JWT_REFRESH_SECRET must be configured");
}

export default {
  secret,
  expiresIn: "3d",
  refreshSecret,
  refreshExpiresIn: "7d"
};
