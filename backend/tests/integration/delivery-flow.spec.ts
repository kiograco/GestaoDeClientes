import request from "supertest";
import { createAdminUser, createContact, createProduct, createTicket } from "../factories";
import { manualOrderPayload } from "../fixtures/delivery";
import { bearerTokenFor } from "../helpers/auth";
import { makeTestApp } from "../helpers/app";

jest.mock("../../src/services/DeliveryAddressServices/DeliveryAddressService", () => {
  const actual = jest.requireActual(
    "../../src/services/DeliveryAddressServices/DeliveryAddressService"
  );

  return {
    ...actual,
    resolveZone: jest.fn(async () => ({ deliveryFee: 8 }))
  };
});

describe("delivery API", () => {
  it("executa fluxo completo de pedido vinculado a ticket e contato", async () => {
    const app = await makeTestApp();
    const user = await createAdminUser();
    const tenantId = user.tenantId;
    const contact = await createContact({ tenantId });
    const ticket = await createTicket({ tenantId, contactId: contact.id });
    const categoryResponse = await request(app)
      .post("/delivery/categories")
      .set("Authorization", bearerTokenFor(user))
      .send({ name: "Lanches", description: "Cardapio principal" })
      .expect(201);

    const productResponse = await request(app)
      .post("/delivery/products")
      .set("Authorization", bearerTokenFor(user))
      .send({
        categoryId: categoryResponse.body.id,
        name: "Burger",
        description: "Burger teste",
        basePrice: 25,
        available: true,
        optionGroups: [
          {
            name: "Adicionais",
            required: false,
            minSelections: 0,
            maxSelections: 2,
            options: [{ name: "Queijo", price: 4, available: true }]
          }
        ]
      })
      .expect(201);

    await request(app)
      .post("/delivery/zones")
      .set("Authorization", bearerTokenFor(user))
      .send({
        name: "Centro",
        district: "Centro",
        zipCodeStart: "01000000",
        zipCodeEnd: "01099999",
        deliveryFee: 8,
        estimatedMinutes: 40,
        active: true
      })
      .expect(201);

    const orderResponse = await request(app)
      .post("/delivery/orders")
      .set("Authorization", bearerTokenFor(user))
      .send({
        ...manualOrderPayload(contact.id, productResponse.body.id),
        ticketId: ticket.id
      })
      .expect(201);

    expect(orderResponse.body).toEqual(
      expect.objectContaining({
        tenantId,
        contactId: contact.id,
        ticketId: ticket.id,
        subtotal: "50.00",
        deliveryFee: "8.00",
        discount: "2.50",
        total: "55.50"
      })
    );

    const preparing = await request(app)
      .put(`/delivery/orders/${orderResponse.body.id}/status`)
      .set("Authorization", bearerTokenFor(user))
      .send({ status: "PREPARING" })
      .expect(200);

    expect(preparing.body.status).toBe("PREPARING");
  });

  it("nega pedido com produto de outra empresa", async () => {
    const app = await makeTestApp();
    const userA = await createAdminUser();
    const userB = await createAdminUser();
    const contactA = await createContact({ tenantId: userA.tenantId });
    const productB = await createProduct({ tenantId: userB.tenantId });

    await request(app)
      .post("/delivery/orders")
      .set("Authorization", bearerTokenFor(userA))
      .send({
        contactId: contactA.id,
        originChannel: "manual",
        deliveryType: "pickup",
        items: [{ productId: productB.id, quantity: 1 }]
      })
      .expect(404);
  });
});
