import { subDays } from "date-fns";
import request from "supertest";
import { createAdminUser, createContact, createTenant } from "../factories";
import { bearerTokenFor } from "../helpers/auth";
import { makeTestApp } from "../helpers/app";

describe("auth and subscription API", () => {
  it("autentica com login e retorna token JWT", async () => {
    const app = await makeTestApp();
    const user = await createAdminUser({ password: "123456" });

    const response = await request(app)
      .post("/auth/login")
      .send({ email: user.email, password: "123456" })
      .expect(200);

    expect(response.body).toEqual(
      expect.objectContaining({
        token: expect.any(String),
        userId: user.id,
        tenantId: user.tenantId
      })
    );
  });

  it("bloqueia acesso quando assinatura/acesso da empresa esta expirado", async () => {
    const app = await makeTestApp();
    const expiredTenant = await createTenant({
      accessExpiresAt: subDays(new Date(), 1)
    });
    const user = await createAdminUser({ tenantId: expiredTenant.id });

    await request(app)
      .get("/contacts")
      .set("Authorization", bearerTokenFor(user))
      .expect(403)
      .expect(({ body }) => {
        expect(body.error).toBe("ERR_TENANT_ACCESS_EXPIRED");
      });
  });

  it("mantem isolamento multiempresa na listagem", async () => {
    const app = await makeTestApp();
    const userA = await createAdminUser();
    const userB = await createAdminUser();
    await createContact({ tenantId: userA.tenantId, name: "Cliente A" });
    await createContact({ tenantId: userB.tenantId, name: "Cliente B" });

    const response = await request(app)
      .get("/contacts")
      .set("Authorization", bearerTokenFor(userA))
      .expect(200);

    expect(response.body.contacts).toEqual(
      expect.arrayContaining([expect.objectContaining({ name: "Cliente A" })])
    );
    expect(response.body.contacts).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ name: "Cliente B" })])
    );
  });
});
