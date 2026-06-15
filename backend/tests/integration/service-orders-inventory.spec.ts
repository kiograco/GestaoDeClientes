import request from "supertest";
import AuditLog from "../../src/models/AuditLog";
import Pest from "../../src/models/Pest";
import ProductPest from "../../src/models/ProductPest";
import ServiceInventoryBatch from "../../src/models/ServiceInventoryBatch";
import ServiceInventoryItem from "../../src/models/ServiceInventoryItem";
import ServiceInventoryMovement from "../../src/models/ServiceInventoryMovement";
import ServiceInventoryPestRecommendation from "../../src/models/ServiceInventoryPestRecommendation";
import ServiceOrder from "../../src/models/ServiceOrder";
import ServicePest from "../../src/models/ServicePest";
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

const orderPayloadWithBatch = (
  contactId: number,
  inventoryItemId: number,
  inventoryBatchId: number | null,
  quantity: number,
  status = "rascunho"
) => ({
  ...orderPayload(contactId, inventoryItemId, quantity, status),
  items: [
    {
      itemType: "product",
      inventoryItemId,
      inventoryBatchId,
      pestTarget: "Baratas",
      applicationMethod: "pulverizacao",
      dilutionUsed: "10 ml para 1 litro de agua",
      technicalObservation: "Aplicar em pontos de abrigo",
      description: "Inseticida tecnico",
      quantity,
      unitPrice: 80
    }
  ]
});

const countPdfPages = (pdf: Buffer): number =>
  (pdf.toString("latin1").match(/\/Type\s*\/Page\b/g) || []).length;

describe("service orders inventory API", () => {
  it("gerencia pragas centralizadas com busca, duplicidade e isolamento por tenant", async () => {
    const app = await makeTestApp();
    const user = await createAdminUser();
    const otherUser = await createAdminUser();
    const authorization = bearerTokenFor(user);

    const created = await request(app)
      .post("/service/pests")
      .set("Authorization", authorization)
      .send({
        commonName: "Barata Alemã",
        scientificName: "Blattella germanica"
      })
      .expect(201)
      .expect(({ body }) => {
        expect(body).toMatchObject({
          tenantId: user.tenantId,
          commonName: "Barata Alemã",
          scientificName: "Blattella germanica"
        });
      });

    await request(app)
      .post("/service/pests")
      .set("Authorization", authorization)
      .send({
        commonName: "barata alemã",
        scientificName: "Periplaneta americana"
      })
      .expect(409);

    await request(app)
      .post("/service/pests")
      .set("Authorization", authorization)
      .send({
        commonName: "Barata de esgoto",
        scientificName: "blattella germanica"
      })
      .expect(409);

    await request(app)
      .post("/service/pests")
      .set("Authorization", bearerTokenFor(otherUser))
      .send({
        commonName: "Barata Alemã",
        scientificName: "Blattella germanica"
      })
      .expect(201);

    await request(app)
      .get("/service/pests")
      .query({ search: "blattella" })
      .set("Authorization", authorization)
      .expect(200)
      .expect(({ body }) => {
        expect(body).toHaveLength(1);
        expect(body[0]).toMatchObject({
          id: created.body.id,
          commonName: "Barata Alemã",
          scientificName: "Blattella germanica"
        });
      });

    await request(app)
      .put(`/service/pests/${created.body.id}`)
      .set("Authorization", authorization)
      .send({
        commonName: "Barata Germânica",
        scientificName: "Blattella germanica"
      })
      .expect(200)
      .expect(({ body }) => {
        expect(body.commonName).toBe("Barata Germânica");
      });

    await request(app)
      .delete(`/service/pests/${created.body.id}`)
      .set("Authorization", authorization)
      .expect(204);

    expect(await Pest.count({ where: { tenantId: user.tenantId } })).toBe(0);
    expect(await Pest.count({ where: { tenantId: otherUser.tenantId } })).toBe(
      1
    );
  });

  it("vincula produtos e serviços apenas a pragas cadastradas", async () => {
    const app = await makeTestApp();
    const user = await createAdminUser();
    const authorization = bearerTokenFor(user);

    const { body: pest } = await request(app)
      .post("/service/pests")
      .set("Authorization", authorization)
      .send({
        commonName: "Camundongo",
        scientificName: "Mus musculus"
      })
      .expect(201);

    await request(app)
      .post("/service/inventory")
      .set("Authorization", authorization)
      .send({
        name: "Isca raticida sem praga cadastrada",
        unit: "grama",
        quantity: 10,
        minQuantity: 1,
        costPrice: 2,
        salePrice: 10,
        pestIds: [999999]
      })
      .expect(404)
      .expect(({ body }) => {
        expect(body.error).toBe("ERR_PEST_NOT_FOUND");
      });

    await request(app)
      .post("/service/inventory")
      .set("Authorization", authorization)
      .send({
        name: "Isca raticida manual",
        unit: "grama",
        quantity: 10,
        minQuantity: 1,
        costPrice: 2,
        salePrice: 10,
        pestRecommendations: [
          {
            pest: "Camundongo",
            productQuantity: 10,
            diluentQuantity: 0,
            unit: "grama"
          }
        ]
      })
      .expect(400);

    const { body: product } = await request(app)
      .post("/service/inventory")
      .set("Authorization", authorization)
      .send({
        name: "Isca raticida",
        activeIngredient: "Brodifacoum",
        chemicalGroup: "Anticoagulante",
        productCategory: "raticida",
        unit: "grama",
        quantity: 100,
        minQuantity: 10,
        costPrice: 2,
        salePrice: 10,
        pestIds: [pest.id],
        pestRecommendations: [
          {
            pestId: pest.id,
            productQuantity: 10,
            diluentQuantity: 0,
            unit: "grama",
            actionTime: "24 horas",
            technicalObservation: "Instalar em porta-iscas"
          }
        ]
      })
      .expect(201)
      .expect(({ body }) => {
        expect(body.productPests).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              pestId: pest.id,
              pest: expect.objectContaining({
                commonName: "Camundongo",
                scientificName: "Mus musculus"
              })
            })
          ])
        );
        expect(body.pestRecommendations).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              pestId: pest.id,
              pest: expect.objectContaining({ commonName: "Camundongo" })
            })
          ])
        );
      });

    expect(
      await ProductPest.count({
        where: {
          tenantId: user.tenantId,
          productId: product.id,
          pestId: pest.id
        }
      })
    ).toBe(1);
    expect(
      await ServiceInventoryPestRecommendation.count({
        where: {
          tenantId: user.tenantId,
          inventoryItemId: product.id,
          pestId: pest.id
        }
      })
    ).toBe(1);

    await request(app)
      .post("/service/types")
      .set("Authorization", authorization)
      .send({
        name: "Controle de roedores inválido",
        defaultPrice: 120,
        pests: [{ pestId: 999999 }]
      })
      .expect(404)
      .expect(({ body }) => {
        expect(body.error).toBe("ERR_PEST_NOT_FOUND");
      });

    const { body: serviceType } = await request(app)
      .post("/service/types")
      .set("Authorization", authorization)
      .send({
        name: "Controle de roedores",
        description: "Serviço para controle de camundongos",
        technicalDescription: "Instalação e monitoramento de iscas",
        defaultPrice: 120,
        categories: ["controle_roedores"],
        pests: [{ pestId: pest.id }],
        environments: ["residencial"],
        methods: ["iscagem"],
        products: [
          {
            inventoryItemId: product.id,
            averageConsumption: 10
          }
        ]
      })
      .expect(201)
      .expect(({ body }) => {
        expect(body.pests).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              pestId: pest.id,
              pest: expect.objectContaining({
                commonName: "Camundongo",
                scientificName: "Mus musculus"
              })
            })
          ])
        );
      });

    expect(
      await ServicePest.count({
        where: {
          tenantId: user.tenantId,
          serviceTypeId: serviceType.id,
          pestId: pest.id
        }
      })
    ).toBe(1);

    await request(app)
      .get("/service/types")
      .query({ pest: "mus musculus" })
      .set("Authorization", authorization)
      .expect(200)
      .expect(({ body }) => {
        expect(body).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              id: serviceType.id,
              pests: expect.arrayContaining([
                expect.objectContaining({
                  pest: expect.objectContaining({ commonName: "Camundongo" })
                })
              ])
            })
          ])
        );
      });
  });

  it("lista produtos com estoque baixo com lotes sem vazar dados de outro tenant", async () => {
    const app = await makeTestApp();
    const user = await createAdminUser();
    const otherUser = await createAdminUser();
    const authorization = bearerTokenFor(user);
    const lowStockItem = await ServiceInventoryItem.create({
      tenantId: user.tenantId,
      name: "Inseticida baixo estoque",
      unit: "ml",
      quantity: 1,
      minQuantity: 2,
      costPrice: 5,
      salePrice: 20,
      active: true
    });
    const normalStockItem = await ServiceInventoryItem.create({
      tenantId: user.tenantId,
      name: "Inseticida estoque normal",
      unit: "ml",
      quantity: 10,
      minQuantity: 2,
      costPrice: 5,
      salePrice: 20,
      active: true
    });
    const otherTenantItem = await ServiceInventoryItem.create({
      tenantId: otherUser.tenantId,
      name: "Produto de outro tenant",
      unit: "ml",
      quantity: 0,
      minQuantity: 5,
      costPrice: 5,
      salePrice: 20,
      active: true
    });

    await ServiceInventoryBatch.create({
      tenantId: user.tenantId,
      inventoryItemId: lowStockItem.id,
      batchNumber: "BAIXO-001",
      quantity: 1
    });

    const { body } = await request(app)
      .get("/service/inventory-low-stock")
      .set("Authorization", authorization)
      .expect(200);

    expect(body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: lowStockItem.id,
          name: lowStockItem.name,
          batches: expect.arrayContaining([
            expect.objectContaining({ batchNumber: "BAIXO-001" })
          ])
        })
      ])
    );
    expect(body).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: normalStockItem.id }),
        expect.objectContaining({ id: otherTenantItem.id })
      ])
    );
  });

  it("cria ordem de servico selecionando cliente do cadastro centralizado", async () => {
    const app = await makeTestApp();
    const user = await createAdminUser();
    const authorization = bearerTokenFor(user);
    await createContact({ tenantId: user.tenantId });

    const { body: client } = await request(app)
      .post("/clients")
      .set("Authorization", authorization)
      .send({
        registrationType: "legal_entity",
        legalName: "Cliente OS Integrado Ltda",
        tradeName: "Cliente Integrado",
        document: "22333444000155",
        status: "active",
        addresses: [
          {
            addressType: "Matriz",
            zipCode: "01001000",
            street: "Praca da Se",
            number: "100",
            district: "Se",
            city: "Sao Paulo",
            state: "SP"
          }
        ],
        contacts: [
          {
            name: "Responsavel OS",
            phone: "11977770000",
            email: "os-integrado@example.test",
            addressIndex: 0
          }
        ]
      })
      .expect(201);

    const inventoryItem = await ServiceInventoryItem.create({
      tenantId: user.tenantId,
      name: "Produto para OS integrada",
      unit: "unidade",
      quantity: 5,
      minQuantity: 1,
      costPrice: 10,
      salePrice: 30,
      active: true
    });

    await request(app)
      .post("/service/orders")
      .set("Authorization", authorization)
      .send(orderPayload(client.contactId, inventoryItem.id, 1))
      .expect(201)
      .expect(({ body }) => {
        expect(body.contactId).toBe(client.contactId);
        expect(body.contact).toMatchObject({
          id: client.contactId,
          name: "Cliente OS Integrado Ltda"
        });
      });
  });

  it("exige lote e consome o lote selecionado quando controle de lote esta habilitado", async () => {
    const app = await makeTestApp();
    const user = await createAdminUser();
    const authorization = bearerTokenFor(user);
    const contact = await createContact({ tenantId: user.tenantId });
    const inventoryItem = await ServiceInventoryItem.create({
      tenantId: user.tenantId,
      name: "Inseticida tecnico",
      activeIngredient: "Cipermetrina",
      productCategory: "inseticida",
      unit: "ml",
      quantity: 10,
      minQuantity: 1,
      costPrice: 5,
      salePrice: 80,
      lotControlEnabled: true,
      applicationMethods: ["pulverizacao"],
      active: true
    });
    const batch = await ServiceInventoryBatch.create({
      tenantId: user.tenantId,
      inventoryItemId: inventoryItem.id,
      batchNumber: "L-2026-001",
      expirationDate: "2026-12-31",
      quantity: 6
    });

    await request(app)
      .post("/service/orders")
      .set("Authorization", authorization)
      .send(orderPayloadWithBatch(contact.id, inventoryItem.id, null, 2, "concluida"))
      .expect(400);

    await request(app)
      .post("/service/orders")
      .set("Authorization", authorization)
      .send(
        orderPayloadWithBatch(
          contact.id,
          inventoryItem.id,
          batch.id,
          3,
          "concluida"
        )
      )
      .expect(201);

    await inventoryItem.reload();
    await batch.reload();
    const movement = await ServiceInventoryMovement.findOne({
      where: { inventoryItemId: inventoryItem.id }
    });

    expect(inventoryItem.quantity).toBe(7);
    expect(batch.quantity).toBe(3);
    expect(movement).toMatchObject({
      inventoryBatchId: batch.id,
      quantity: -3,
      unitCost: "5.00",
      totalCost: "15.00",
      pestTarget: "Baratas"
    });
  });

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
        paymentDueDate: "2026-06-20T00:00:00.000Z",
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
      .post(`/service/orders/${created.body.id}/billing-reminder`)
      .set("Authorization", authorization)
      .send({ channels: ["internal"] })
      .expect(200)
      .expect(({ body }) => {
        expect(body.sent).toEqual(["internal"]);
        expect(body.failed).toEqual({});
        expect(body.message).toContain("Valor em aberto");
      });

    await request(app)
      .post(`/service/orders/${created.body.id}/billing-reminder`)
      .set("Authorization", authorization)
      .send({ channels: ["internal"] })
      .expect(409);

    const billingReminderAudit = await AuditLog.findOne({
      where: {
        action: "service_order_billing_reminder_sent",
        resource: "service_order_billing_reminder",
        resourceId: String(created.body.id)
      }
    });
    expect(billingReminderAudit).toMatchObject({
      tenantId: user.tenantId,
      userId: user.id
    });
    expect(billingReminderAudit?.metadata).toMatchObject({
      serviceOrderId: String(created.body.id),
      channels: ["internal"],
      sent: ["internal"]
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
        expect(body).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              action: "service_order_billing_reminder_sent",
              resource: "service_order_billing_reminder",
              resourceId: String(created.body.id)
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

    await request(app)
      .get("/service/orders-monthly-closing")
      .query({ month: "2026-06" })
      .set("Authorization", authorization)
      .expect(200)
      .expect(({ body }) => {
        expect(body.month).toBe("2026-06");
        expect(body.summary).toMatchObject({
          orders: 1,
          totalReceived: 150,
          totalOpen: 0,
          productCost: 25,
          grossProfit: 125,
          grossMarginPercent: 83.33
        });
        expect(body.rankings.byCustomer).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ label: contact.name, value: 150 })
          ])
        );
      });

    await request(app)
      .get("/service/orders-monthly-closing")
      .query({ month: "2026-06", format: "csv" })
      .set("Authorization", authorization)
      .expect(200)
      .expect("Content-Type", /text\/csv/)
      .expect(({ text }) => {
        expect(text).toContain('"OS","Cliente","Tecnico"');
        expect(text).toContain('"Instalacao com produto"');
        expect(text).toContain('"true"');
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
