const permissionsByProfile: Record<string, string[]> = {
  superadmin: ["*"],
  admin: [
    "attendance-types:view",
    "attendance-types:create",
    "attendance-types:edit",
    "attendance-types:delete",
    "attendance-types:export",
    "service-orders:view",
    "service-orders:create",
    "service-orders:edit",
    "service-orders:delete",
    "service-orders:cancel",
    "service-orders:reschedule",
    "service-orders:complete",
    "service-orders:print",
    "service-orders:export",
    "service-orders:duplicate",
    "service-schedule:view",
    "service-schedule:create",
    "service-schedule:edit",
    "service-schedule:delete",
    "service-schedule:change-technician",
    "service-schedule:change-team",
    "service-schedule:change-time",
    "service-schedule:create-recurrence"
  ],
  supervisor: [
    "attendance-types:view",
    "attendance-types:create",
    "attendance-types:edit",
    "attendance-types:delete",
    "attendance-types:export",
    "service-orders:view",
    "service-orders:create",
    "service-orders:edit",
    "service-orders:cancel",
    "service-orders:reschedule",
    "service-orders:complete",
    "service-orders:print",
    "service-orders:export",
    "service-schedule:view",
    "service-schedule:create",
    "service-schedule:edit",
    "service-schedule:change-technician",
    "service-schedule:change-time",
    "service-schedule:create-recurrence"
  ],
  atendente: [
    "attendance-types:view",
    "service-orders:view",
    "service-orders:create",
    "service-orders:edit",
    "service-orders:cancel",
    "service-orders:reschedule",
    "service-orders:complete",
    "service-orders:print",
    "service-orders:export",
    "service-schedule:view",
    "service-schedule:create",
    "service-schedule:edit",
    "service-schedule:change-technician",
    "service-schedule:change-time",
    "service-schedule:create-recurrence"
  ],
  tecnico: [
    "attendance-types:view",
    "service-orders:view",
    "service-orders:print",
    "service-schedule:view"
  ],
  user: ["attendance-types:view"]
};

export const can = (
  profile: string,
  permission: string,
  userPermissions?: string[]
): boolean => {
  if (userPermissions) {
    return (
      userPermissions.includes("*") || userPermissions.includes(permission)
    );
  }
  const permissions = permissionsByProfile[profile] || [];
  return permissions.includes("*") || permissions.includes(permission);
};

export const ensurePermission = (
  profile: string,
  permission: string,
  error = "ERR_NO_PERMISSION",
  userPermissions?: string[]
): void => {
  if (!can(profile, permission, userPermissions)) {
    throw new Error(error);
  }
};
