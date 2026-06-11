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
      itemType: "service",
      description: "Instalacao tecnica",
      quantity: 1,
      unitPrice: 150
    },
    {
      itemType: "product",
      inventoryItemId,
      description: "Filtro de agua",
      quantity,
      unitPrice: 35.9
    }
  ]
});

const countPdfPages = (pdf: Buffer): number =>
  (pdf.toString("latin1").match(/\/Type\s*\/Page\b/g) || []).length;

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
      .send({
        ...orderPayload(contact.id, inventoryItem.id, 2),
        financialStatus: "cobrado",
        paymentMethod: "pix",
        chargedAmount: 150,
        paidAmount: 50,
        paymentDueDate: "2026-06-15T00:00:00.000Z",
        financialObservation: "Pagamento parcial combinado"
      })
      .expect(201)
      .expect(({ body }) => {
        expect(body).toMatchObject({
          financialStatus: "cobrado",
          paymentMethod: "pix",
          chargedAmount: "150.00",
          paidAmount: "50.00",
          financialObservation: "Pagamento parcial combinado"
        });
      });

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
        expect(countPdfPages(response.body)).toBe(1);
      });

    await request(app)
      .get(`/service/orders/${created.body.id}/document/internal`)
      .set("Authorization", authorization)
      .expect(200)
      .expect("Content-Type", /pdf/)
      .expect(response => {
        expect(response.body.length).toBeGreaterThan(1000);
        expect(countPdfPages(response.body)).toBe(1);
      });

    await request(app)
      .get("/service/orders-dashboard")
      .set("Authorization", authorization)
      .expect(200)
      .expect(({ body }) => {
        expect(body.serviceRevenue).toBe(150);
        expect(body.productCost).toBe(25);
        expect(body.grossProfit).toBe(125);
        expect(body.grossMarginPercent).toBe(83.33);
        expect(body.totalCharged).toBe(150);
        expect(body.totalReceivable).toBe(100);
        expect(body.totalReceived).toBe(50);
        expect(body.overdueAmount).toBe(0);
        expect(body.paidOrders).toBe(0);
        expect(body.grossProfitPending).toBe(125);
        expect(body.productsByCost).toMatchObject({ "Filtro de agua": 25 });
        expect(body.ordersProfitability).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              id: created.body.id,
              serviceRevenue: 150,
              productCost: 25,
              grossProfit: 125
            })
          ])
        );
      });

    await request(app)
      .get("/service/orders")
      .query({ paymentMethod: "pix" })
      .set("Authorization", authorization)
      .expect(200)
      .expect(({ body }) => {
        expect(body).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ id: created.body.id })
          ])
        );
      });

    await request(app)
      .get("/service/orders")
      .query({ financialView: "paid" })
      .set("Authorization", authorization)
      .expect(200)
      .expect(({ body }) => {
        expect(body).toHaveLength(0);
      });

    await request(app)
      .get("/service/orders")
      .query({ financialView: "dueSoon" })
      .set("Authorization", authorization)
      .expect(200)
      .expect(({ body }) => {
        expect(body).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ id: created.body.id })
          ])
        );
      });

    await request(app)
      .put(`/service/orders/${created.body.id}`)
      .set("Authorization", authorization)
      .send({
        ...orderPayload(contact.id, inventoryItem.id, 2, "concluida"),
        financialStatus: "pago",
        paymentMethod: "pix",
        chargedAmount: 150,
        paidAmount: 150,
        paidAt: "2026-06-16T00:00:00.000Z",
        financialObservation: "Pagamento quitado"
      })
      .expect(200)
      .expect(({ body }) => {
        expect(body).toMatchObject({
          financialStatus: "pago",
          paymentMethod: "pix",
          chargedAmount: "150.00",
          paidAmount: "150.00",
          financialObservation: "Pagamento quitado"
        });
      });

    const financialAuditLog = await AuditLog.findOne({
      where: {
        action: "service_order_financial_updated",
        resource: "service_order_financial",
        resourceId: String(created.body.id)
      }
    });
    expect(financialAuditLog).toMatchObject({
      tenantId: user.tenantId,
      userId: user.id
    });
    expect(financialAuditLog?.metadata).toMatchObject({
      serviceOrderId: created.body.id,
      changedFields: expect.arrayContaining([
        "financialStatus",
        "paidAmount",
        "paidAt",
        "financialObservation"
      ])
    });

    await request(app)
      .get("/service/orders")
      .query({ financialView: "paid" })
      .set("Authorization", authorization)
      .expect(200)
      .expect(({ body }) => {
        expect(body).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ id: created.body.id, financialStatus: "pago" })
          ])
        );
      });

    await request(app)
      .get("/service/orders-dashboard")
      .query({ financialView: "paid" })
      .set("Authorization", authorization)
      .expect(200)
      .expect(({ body }) => {
        expect(body.totalCharged).toBe(150);
        expect(body.totalReceivable).toBe(0);
        expect(body.totalReceived).toBe(150);
        expect(body.paidOrders).toBe(1);
        expect(body.grossProfitPaid).toBe(125);
        expect(body.grossProfitPending).toBe(0);
      });

    await request(app)
      .get("/service/financial-audit")
      .set("Authorization", authorization)
      .expect(200)
      .expect(({ body }) => {
        expect(body).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              action: "service_order_financial_updated",
              resource: "service_order_financial",
              resourceId: String(created.body.id),
              user: expect.objectContaining({ id: user.id })
            })
          ])
        );
      });

    await request(app)
      .get("/service/orders-financial-report")
      .query({
        financialView: "paid",
        dateField: "paidAt",
        start: "2026-06-01T00:00:00.000Z",
        end: "2026-06-30T23:59:59.999Z"
      })
      .set("Authorization", authorization)
      .expect(200)
      .expect(({ body }) => {
        expect(body.summary).toMatchObject({
          orders: 1,
          totalCharged: 150,
          totalReceived: 150,
          totalReceivable: 0,
          serviceRevenue: 150,
          productCost: 25,
          grossProfit: 125,
          paidOrders: 1
        });
        expect(body.rows).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              id: created.body.id,
              customerName: contact.name,
              financialStatus: "pago",
              grossProfit: 125
            })
          ])
        );
      });

    await request(app)
      .get("/service/orders-financial-report")
      .query({
        format: "csv",
        financialView: "paid",
        dateField: "paidAt",
        start: "2026-06-01T00:00:00.000Z",
        end: "2026-06-30T23:59:59.999Z"
      })
      .set("Authorization", authorization)
      .expect(200)
      .expect("Content-Type", /text\/csv/)
      .expect(({ text }) => {
        expect(text).toContain('"OS","Cliente","Servico"');
        expect(text).toContain('"Instalacao com produto"');
        expect(text).toContain('"125"');
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
    await request(app)
      .get("/service/financial-audit")
      .set("Authorization", bearerTokenFor(agent))
      .expect(403);
  });
});
