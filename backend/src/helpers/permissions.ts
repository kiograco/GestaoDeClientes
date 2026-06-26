const permissionsByProfile: Record<string, string[]> = {
  superadmin: ["*"],
  admin: [
    "attendance-types:view",
    "attendance-types:create",
    "attendance-types:edit",
    "attendance-types:delete",
    "attendance-types:export"
  ],
  supervisor: [
    "attendance-types:view",
    "attendance-types:create",
    "attendance-types:edit",
    "attendance-types:delete",
    "attendance-types:export"
  ],
  atendente: ["attendance-types:view"],
  tecnico: ["attendance-types:view"],
  user: ["attendance-types:view"]
};

export const can = (profile: string, permission: string): boolean => {
  const permissions = permissionsByProfile[profile] || [];
  return permissions.includes("*") || permissions.includes(permission);
};

export const ensurePermission = (
  profile: string,
  permission: string,
  error = "ERR_NO_PERMISSION"
): void => {
  if (!can(profile, permission)) {
    throw new Error(error);
  }
};
