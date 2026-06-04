import request from "supertest";
import { createAdminUser } from "../factories";
import { bearerTokenFor } from "../helpers/auth";
import { makeTestApp } from "../helpers/app";

describe("security regressions", () => {
  it("impede admin de tenant de promover usuario para superadmin", async () => {
    const app = await makeTestApp();
    const admin = await createAdminUser();
    const target = await createAdminUser({ tenantId: admin.tenantId });

    await request(app)
      .put(`/users/${target.id}`)
      .set("Authorization", bearerTokenFor(admin))
      .send({ profile: "superadmin" })
      .expect(400);
  });

  it("impede admin de alterar o proprio perfil", async () => {
    const app = await makeTestApp();
    const admin = await createAdminUser();

    await request(app)
      .put(`/users/${admin.id}`)
      .set("Authorization", bearerTokenFor(admin))
      .send({ profile: "user" })
      .expect(403)
      .expect(({ body }) => {
        expect(body.error).toBe("ERR_CANNOT_CHANGE_OWN_PROFILE");
      });
  });
});
