import { addDays, differenceInCalendarDays, endOfDay, isAfter } from "date-fns";
import Tenant from "../models/Tenant";

export const isTenantAccessActive = (
  tenant?: Pick<Tenant, "status" | "accessExpiresAt"> | null
): boolean =>
  !!tenant &&
  tenant.status === "active" &&
  (!tenant.accessExpiresAt || isAfter(tenant.accessExpiresAt, new Date()));

export const getTenantAccessDaysRemaining = (
  accessExpiresAt?: Date | string | null
): number | null => {
  if (!accessExpiresAt) return null;

  return Math.max(
    0,
    differenceInCalendarDays(new Date(accessExpiresAt), new Date()) + 1
  );
};

export const createTenantAccessExpiration = (paidDays: number): Date =>
  endOfDay(addDays(new Date(), paidDays - 1));

export const extendTenantAccessExpiration = (
  currentExpiration: Date | null,
  paidDays: number
): Date => {
  const now = new Date();
  if (!currentExpiration || !isAfter(currentExpiration, now)) {
    return createTenantAccessExpiration(paidDays);
  }

  return endOfDay(addDays(currentExpiration, paidDays));
};
