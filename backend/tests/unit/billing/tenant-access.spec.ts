import { addDays, subDays } from "date-fns";
import {
  createTenantAccessExpiration,
  extendTenantAccessExpiration,
  getTenantAccessDaysRemaining,
  isTenantAccessActive
} from "../../../src/helpers/TenantAccess";

const tenantAccess = (status: string, accessExpiresAt: Date | null) =>
  ({ status, accessExpiresAt } as LegacyAny);

describe("TenantAccess", () => {
  it("bloqueia empresa inativa ou com acesso expirado", () => {
    expect(isTenantAccessActive(null)).toBe(false);
    expect(isTenantAccessActive(tenantAccess("inactive", null))).toBe(false);
    expect(
      isTenantAccessActive({
        status: "active",
        accessExpiresAt: subDays(new Date(), 1)
      })
    ).toBe(false);
  });

  it("permite empresa ativa sem vencimento ou com vencimento futuro", () => {
    expect(isTenantAccessActive(tenantAccess("active", null))).toBe(true);
    expect(
      isTenantAccessActive({
        status: "active",
        accessExpiresAt: addDays(new Date(), 1)
      })
    ).toBe(true);
  });

  it("calcula dias restantes e extensao da assinatura", () => {
    expect(getTenantAccessDaysRemaining(null)).toBeNull();
    expect(getTenantAccessDaysRemaining(addDays(new Date(), 4))).toBe(5);

    const expiration = createTenantAccessExpiration(30);
    expect(expiration.getHours()).toBe(23);

    const extended = extendTenantAccessExpiration(addDays(new Date(), 10), 30);
    expect(extended.getTime()).toBeGreaterThan(addDays(new Date(), 30).getTime());
  });
});
