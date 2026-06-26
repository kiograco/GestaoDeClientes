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
});
