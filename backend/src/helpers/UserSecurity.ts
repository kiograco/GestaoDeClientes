export const TENANT_USER_PROFILES = [
  "admin",
  "supervisor",
  "atendente",
  "tecnico",
  "user"
];
export const ADMIN_USER_PROFILES = ["superadmin", ...TENANT_USER_PROFILES];
export const STOCK_MANAGER_PROFILES = ["admin", "superadmin", "supervisor"];
export const MIN_PASSWORD_LENGTH = 10;

export const PASSWORD_POLICY_MESSAGE =
  "Password must be at least 10 characters long.";
