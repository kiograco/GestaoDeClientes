import { getValue, setValue, removeValue } from "./redisClient";

export const AUTH_CACHE_TTL_SECONDS = 60;

export interface CachedAuthUser {
  profile: string;
  tenantId: number;
  tenantStatus?: string;
  tenantAccessExpiresAt: string | null;
  permissions?: string[];
}

const authCacheKey = (tenantId: number | string, userId: string): string =>
  `auth:user:${tenantId}:${userId}`;

export const getCachedAuthUser = async (
  tenantId: number | string,
  userId: string
): Promise<CachedAuthUser | null> => {
  const cached = await getValue(authCacheKey(tenantId, userId));
  return (cached as CachedAuthUser) || null;
};

export const setCachedAuthUser = async (
  tenantId: number | string,
  userId: string,
  data: CachedAuthUser
): Promise<void> => {
  await setValue(authCacheKey(tenantId, userId), data, AUTH_CACHE_TTL_SECONDS);
};

export const invalidateAuthCache = async (
  tenantId: number | string,
  userId: string | number
): Promise<void> => {
  await removeValue(authCacheKey(tenantId, String(userId)));
};
