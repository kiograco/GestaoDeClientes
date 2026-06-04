import request from "supertest";
import Contact from "../../src/models/Contact";
import ContactTag from "../../src/models/ContactTag";
import ContactWallet from "../../src/models/ContactWallet";
import Tag from "../../src/models/Tag";
import { bearerTokenFor } from "../helpers/auth";
import { makeTestApp } from "../helpers/app";
import { createAdminUser, createContact } from "../factories";

jest.mock("../../src/services/WbotServices/CheckIsValidContact", () => ({
  __esModule: true,
  default: jest.fn(async number => ({ user: number }))
}));

jest.mock("../../src/services/WbotServices/GetProfilePicUrl", () => ({
  __esModule: true,
  default: jest.fn(async () => null)
}));

describe("contacts API", () => {
  it("cria, lista, edita e remove cliente autenticado", async () => {
    const app = await makeTestApp();
    const user = await createAdminUser();
    const authorization = bearerTokenFor(user);

    const created = await request(app)
      .post("/contacts")
      .set("Authorization", authorization)
      .send({
        name: "Cliente API",
        number: "5511999990000",
        email: "cliente.api@example.test"
      })
      .expect(200);

    expect(created.body).toEqual(
      expect.objectContaining({
        name: "Cliente API",
        number: "5511999990000",
        tenantId: user.tenantId
      })
    );

    const listed = await request(app)
      .get("/contacts")
      .set("Authorization", authorization)
      .expect(200);

    expect(listed.body.contacts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: created.body.id, name: "Cliente API" })
      ])
    );

    await request(app)
      .put(`/contacts/${created.body.id}`)
      .set("Authorization", authorization)
      .send({ name: "Cliente API Editado", number: "5511888880000" })
      .expect(200);

    await request(app)
      .delete(`/contacts/${created.body.id}`)
      .set("Authorization", authorization)
      .expect(200);

    expect(await Contact.findByPk(created.body.id)).toBeNull();
  });

  it("impede acesso a contato de outra empresa", async () => {
    const app = await makeTestApp();
    const userA = await createAdminUser();
    const userB = await createAdminUser();
    const contactB = await createContact({ tenantId: userB.tenantId });

    await request(app)
      .get(`/contacts/${contactB.id}`)
      .set("Authorization", bearerTokenFor(userA))
      .expect(404);
  });

  it("impede vincular carteira de outra empresa ao contato", async () => {
    const app = await makeTestApp();
    const userA = await createAdminUser();
    const userB = await createAdminUser();
    const contactA = await createContact({ tenantId: userA.tenantId });

    await request(app)
      .put(`/contact-wallet/${contactA.id}`)
      .set("Authorization", bearerTokenFor(userA))
      .send({ wallets: [userB.id] })
      .expect(404)
      .expect(({ body }) => {
        expect(body.error).toBe("ERR_WALLET_NOT_FOUND");
      });

    expect(await ContactWallet.count()).toBe(0);
  });

  it("impede vincular tag de outra empresa ao contato", async () => {
    const app = await makeTestApp();
    const userA = await createAdminUser();
    const userB = await createAdminUser();
    const contactA = await createContact({ tenantId: userA.tenantId });
    const tagB = await Tag.create({
      tag: "VIP",
      color: "#ff0000",
      userId: userB.id,
      tenantId: userB.tenantId
    });

    await request(app)
      .put(`/contact-tags/${contactA.id}`)
      .set("Authorization", bearerTokenFor(userA))
      .send({ tags: [tagB.id] })
      .expect(404)
      .expect(({ body }) => {
        expect(body.error).toBe("ERR_TAG_NOT_FOUND");
      });

    expect(await ContactTag.count()).toBe(0);
  });
});
