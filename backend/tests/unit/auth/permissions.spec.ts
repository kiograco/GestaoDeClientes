import { can } from "../../helpers/permissions";

describe("permissions by profile", () => {
  it("permite superadmin em qualquer recurso", () => {
    expect(can("superadmin", "tenants:delete")).toBe(true);
  });

  it("permite admin gerenciar cadastros e pedidos", () => {
    expect(can("admin", "products:write")).toBe(true);
    expect(can("admin", "users:write")).toBe(true);
  });

  it("impede atendente de gerenciar usuarios e produtos", () => {
    expect(can("user", "tickets:write")).toBe(true);
    expect(can("user", "users:write")).toBe(false);
    expect(can("user", "products:write")).toBe(false);
  });
});
