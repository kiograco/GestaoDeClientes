import request from "supertest";
import AuditLog from "../../src/models/AuditLog";
import ServiceInventoryItem from "../../src/models/ServiceInventoryItem";
import ServiceInventoryMovement from "../../src/models/ServiceInventoryMovement";
import ServiceOrder from "../../src/models/ServiceOrder";
import { bearerTokenFor } from "../helpers/auth";
import { makeTestApp } from "../helpers/app";
import { createAdminUser, createAgentUser, createContact } from "../factories";

const orderPayload = (
  contactId: number,
  inventoryItemId: number,
  quantity: number,
  status = "rascunho"
) => ({
  contactId,
  title: "Instalacao com produto",
  serviceType: "Instalacao",
  priority: "media",
  status,
  scheduledStart: "2026-06-10T10:00:00.000Z",
  scheduledEnd: "2026-06-10T11:00:00.000Z",
  items: [
    {
      itemType: "product",
      inventoryItemId,
      description: "Filtro de agua",
      quantity,
      unitPrice: 35.9
    }
  ]
});

describe("service orders inventory API", () => {
  it("baixa estoque uma unica vez ao concluir ordem de servico", async () => {
    const app = await makeTestApp();
    const user = await createAdminUser();
    const authorization = bearerTokenFor(user);
    const contact = await createContact({ tenantId: user.tenantId });
    const inventoryItem = await ServiceInventoryItem.create({
      tenantId: user.tenantId,
      name: "Filtro de agua",
      unit: "unidade",
      quantity: 5,
      minQuantity: 1,
      costPrice: 12.5,
      salePrice: 35.9,
      active: true
    });

    const created = await request(app)
      .post("/service/orders")
      .set("Authorization", authorization)
      .send(orderPayload(contact.id, inventoryItem.id, 2))
      .expect(201);

    await request(app)
      .put(`/service/orders/${created.body.id}`)
      .set("Authorization", authorization)
      .send(orderPayload(contact.id, inventoryItem.id, 2, "concluida"))
      .expect(200);

    await request(app)
      .put(`/service/orders/${created.body.id}`)
      .set("Authorization", authorization)
      .send(orderPayload(contact.id, inventoryItem.id, 2, "concluida"))
      .expect(200);

    await inventoryItem.reload();
    const serviceOrder = await ServiceOrder.findByPk(created.body.id);

    expect(inventoryItem.quantity).toBe(3);
    expect(serviceOrder?.inventoryDeductedAt).toBeTruthy();
    expect(await ServiceInventoryMovement.count()).toBe(1);
    expect(await ServiceInventoryMovement.findOne()).toMatchObject({
      tenantId: user.tenantId,
      inventoryItemId: inventoryItem.id,
      serviceOrderId: created.body.id,
      movementType: "service_order_deduction",
      quantity: -2,
      previousQuantity: 5,
      newQuantity: 3
    });

    await request(app)
      .get(`/service/orders/${created.body.id}/document`)
      .set("Authorization", authorization)
      .expect(200)
      .expect("Content-Type", /pdf/)
      .expect(response => {
        expect(response.body.length).toBeGreaterThan(1000);
      });

    await request(app)
      .get(`/service/orders/${created.body.id}/document/internal`)
      .set("Authorization", authorization)
      .expect(200)
      .expect("Content-Type", /pdf/)
      .expect(response => {
        expect(response.body.length).toBeGreaterThan(1000);
      });
  });

  it("bloqueia conclusao sem saldo e registra auditoria da falha", async () => {
    const app = await makeTestApp();
    const user = await createAdminUser();
    const authorization = bearerTokenFor(user);
    const contact = await createContact({ tenantId: user.tenantId });
    const inventoryItem = await ServiceInventoryItem.create({
      tenantId: user.tenantId,
      name: "Filtro de agua",
      unit: "unidade",
      quantity: 1,
      minQuantity: 1,
      costPrice: 12.5,
      salePrice: 35.9,
      active: true
    });

    const created = await request(app)
      .post("/service/orders")
      .set("Authorization", authorization)
      .send(orderPayload(contact.id, inventoryItem.id, 2))
      .expect(201);

    await request(app)
      .put(`/service/orders/${created.body.id}`)
      .set("Authorization", authorization)
      .send(orderPayload(contact.id, inventoryItem.id, 2, "concluida"))
      .expect(409)
      .expect(({ body }) => {
        expect(body.error).toContain("Estoque insuficiente para Filtro de agua");
        expect(body.error).toContain("Saldo atual: 1");
        expect(body.error).toContain("necessario: 2");
      });

    await inventoryItem.reload();
    const auditLog = await AuditLog.findOne({
      where: { action: "service_inventory_auto_deduct_failed" }
    });

    expect(inventoryItem.quantity).toBe(1);
    expect(await ServiceInventoryMovement.count()).toBe(0);
    expect(auditLog).toMatchObject({
      tenantId: user.tenantId,
      userId: user.id,
      resource: "service_inventory",
      resourceId: String(created.body.id)
    });
    expect(auditLog?.metadata).toMatchObject({
      serviceOrderId: String(created.body.id)
    });
    expect(String(auditLog?.metadata.reason)).toContain(
      "Estoque insuficiente para Filtro de agua"
    );

    await request(app)
      .get("/service/inventory-audit")
      .set("Authorization", authorization)
      .expect(200)
      .expect(({ body }) => {
        expect(body).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              action: "service_inventory_auto_deduct_failed",
              resource: "service_inventory",
              resourceId: String(created.body.id),
              user: expect.objectContaining({ id: user.id })
            })
          ])
        );
        expect(String(body[0].metadata.reason)).toContain(
          "Estoque insuficiente para Filtro de agua"
        );
      });

    const agent = await createAgentUser({ tenantId: user.tenantId });
    await request(app)
      .get("/service/inventory-audit")
      .set("Authorization", bearerTokenFor(agent))
      .expect(403);
  });
});
