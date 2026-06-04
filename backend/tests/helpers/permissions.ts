const permissionsByProfile: Record<string, string[]> = {
  superadmin: ["*"],
  admin: [
    "contacts:write",
    "tickets:write",
    "products:write",
    "orders:write",
    "users:write"
  ],
  user: ["contacts:read", "tickets:write", "orders:write"]
};

export const can = (profile: string, permission: string): boolean => {
  const permissions = permissionsByProfile[profile] || [];
  return permissions.includes("*") || permissions.includes(permission);
};
