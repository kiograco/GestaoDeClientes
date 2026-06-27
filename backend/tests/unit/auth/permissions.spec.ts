import { can } from "../../../src/helpers/permissions";

describe("permissions by profile", () => {
  it("permite superadmin em qualquer recurso", () => {
    expect(can("superadmin", "tenants:delete")).toBe(true);
  });

  it("permite admin gerenciar cadastros e pedidos", () => {
    expect(can("admin", "attendance-types:create")).toBe(true);
    expect(can("admin", "attendance-types:export")).toBe(true);
  });

  it("impede atendente de gerenciar usuarios e produtos", () => {
    expect(can("user", "attendance-types:view")).toBe(true);
    expect(can("user", "attendance-types:create")).toBe(false);
    expect(can("user", "attendance-types:delete")).toBe(false);
  });

  it("usa permissoes explicitas do usuario quando configuradas", () => {
    expect(can("user", "service-orders:view", ["service-orders:view"])).toBe(
      true
    );
    expect(can("admin", "service-orders:view", [])).toBe(false);
    expect(can("user", "service-orders:delete", ["*"])).toBe(true);
  });
});
