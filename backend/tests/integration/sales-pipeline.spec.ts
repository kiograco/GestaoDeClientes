import request from "supertest";
import SalesOpportunity from "../../src/models/SalesOpportunity";
import SalesOpportunityLog from "../../src/models/SalesOpportunityLog";
import SalesProposal from "../../src/models/SalesProposal";
import ServiceAttendant from "../../src/models/ServiceAttendant";
import ServiceOrder from "../../src/models/ServiceOrder";
import ServiceOrderItem from "../../src/models/ServiceOrderItem";
import { bearerTokenFor } from "../helpers/auth";
import { makeTestApp } from "../helpers/app";
import { createAdminUser, createContact } from "../factories";

describe("sales pipeline API", () => {
  it("gerencia oportunidades por tenant e converte em ordem de servico", async () => {
    const app = await makeTestApp();
    const user = await createAdminUser();
    const otherUser = await createAdminUser();
    const authorization = bearerTokenFor(user);
    const contact = await createContact({ tenantId: user.tenantId });
    const otherContact = await createContact({ tenantId: otherUser.tenantId });

    const created = await request(app)
      .post("/api/v1/sales/pipeline")
      .set("Authorization", authorization)
      .send({
        contactId: contact.id,
        ownerUserId: user.id,
        title: "Contrato mensal de manutencao",
        description: "Cliente quer manutencao preventiva",
        stage: "novo",
        estimatedValue: 1200,
        expectedCloseDate: "2026-06-30T00:00:00.000Z",
        source: "indicacao",
        notes: "Prioridade alta"
      })
      .expect(201)
      .expect(({ body }) => {
        expect(body).toMatchObject({
          tenantId: user.tenantId,
          contactId: contact.id,
          ownerUserId: user.id,
          title: "Contrato mensal de manutencao",
          stage: "novo",
          estimatedValue: "1200.00"
        });
        expect(body.contact).toMatchObject({ id: contact.id });
      });

    await request(app)
      .post("/api/v1/sales/pipeline")
      .set("Authorization", bearerTokenFor(otherUser))
      .send({
        contactId: otherContact.id,
        ownerUserId: otherUser.id,
        title: "Oportunidade outro tenant",
        stage: "novo",
        estimatedValue: 800
      })
      .expect(201);

    const staleDate = new Date();
    staleDate.setDate(staleDate.getDate() - 10);
    await SalesOpportunity.sequelize?.query(
      'UPDATE "SalesOpportunities" SET "updatedAt" = :staleDate WHERE id = :id AND "tenantId" = :tenantId',
      {
        replacements: {
          staleDate,
          id: created.body.id,
          tenantId: user.tenantId
        }
      }
    );

    await request(app)
      .get("/api/v1/sales/pipeline-followups?days=7")
      .set("Authorization", authorization)
      .expect(200)
      .expect(({ body }) => {
        expect(body).toHaveLength(1);
        expect(body[0]).toMatchObject({ id: created.body.id });
      });

    await request(app)
      .post("/api/v1/sales/pipeline-followups/run")
      .set("Authorization", authorization)
      .send({ days: 7 })
      .expect(200)
      .expect(({ body }) => {
        expect(body).toMatchObject({ total: 1, sent: 1, skipped: 0 });
      });

    await request(app)
      .post("/api/v1/sales/pipeline-followups/run")
      .set("Authorization", authorization)
      .send({ days: 7 })
      .expect(200)
      .expect(({ body }) => {
        expect(body).toMatchObject({ total: 1, sent: 0, skipped: 1 });
      });

    await request(app)
      .put(`/api/v1/sales/pipeline/${created.body.id}`)
      .set("Authorization", authorization)
      .send({
        contactId: contact.id,
        ownerUserId: user.id,
        title: "Contrato mensal de manutencao",
        description: "Proposta enviada",
        stage: "proposta_enviada",
        estimatedValue: 1300,
        expectedCloseDate: "2026-06-30T00:00:00.000Z",
        source: "indicacao"
      })
      .expect(200)
      .expect(({ body }) => {
        expect(body.stage).toBe("proposta_enviada");
        expect(body.estimatedValue).toBe("1300.00");
        expect(body.logs).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ action: "stage_changed" }),
            expect.objectContaining({ action: "created" })
          ])
        );
      });

    await request(app)
      .get("/api/v1/sales/pipeline")
      .set("Authorization", authorization)
      .expect(200)
      .expect(({ body }) => {
        expect(body).toHaveLength(1);
        expect(body[0]).toMatchObject({ id: created.body.id });
      });

    await request(app)
      .get("/api/v1/sales/pipeline-dashboard")
      .set("Authorization", authorization)
      .expect(200)
      .expect(({ body }) => {
        expect(body).toMatchObject({
          total: 1,
          open: 1,
          won: 0,
          lost: 0,
          openValue: 1300,
          conversionRate: 0
        });
        expect(body.byStage.proposta_enviada).toMatchObject({
          count: 1,
          value: 1300
        });
      });

    const proposal = await request(app)
      .post(`/api/v1/sales/pipeline/${created.body.id}/proposals`)
      .set("Authorization", authorization)
      .send({
        title: "Proposta de manutencao mensal",
        introduction: "Plano mensal com visitas preventivas.",
        status: "enviada",
        validUntil: "2026-07-15T00:00:00.000Z",
        discount: 100,
        observation: "Valida por 15 dias.",
        items: [
          {
            description: "Manutencao preventiva",
            quantity: 2,
            unitPrice: 500
          },
          {
            description: "Configuracao adicional",
            quantity: 1,
            unitPrice: 300
          }
        ]
      })
      .expect(201)
      .expect(({ body }) => {
        expect(body).toMatchObject({
          tenantId: user.tenantId,
          salesOpportunityId: created.body.id,
          contactId: contact.id,
          title: "Proposta de manutencao mensal",
          status: "enviada",
          subtotal: "1300.00",
          discount: "100.00",
          total: "1200.00"
        });
        expect(body.publicToken).toBeTruthy();
        expect(body.items).toHaveLength(2);
      });

    await request(app)
      .get(`/api/v1/portal/proposals/${proposal.body.publicToken}`)
      .expect(200)
      .expect(({ body }) => {
        expect(body).toMatchObject({
          id: proposal.body.id,
          tenantId: user.tenantId,
          total: "1200.00"
        });
      });

    await request(app)
      .post(`/api/v1/portal/proposals/${proposal.body.publicToken}/approve`)
      .expect(200)
      .expect(({ body }) => {
        expect(body.status).toBe("aprovada");
        expect(body.approvedAt).toBeTruthy();
      });

    await request(app)
      .get(`/api/v1/portal/proposals/${proposal.body.publicToken}/document`)
      .expect(200)
      .expect("Content-Type", /pdf/);

    await request(app)
      .get(`/api/v1/sales/pipeline/${created.body.id}/proposals`)
      .set("Authorization", authorization)
      .expect(200)
      .expect(({ body }) => {
        expect(body).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ id: proposal.body.id, total: "1200.00" })
          ])
        );
      });

    await request(app)
      .get(`/api/v1/sales/proposals/${proposal.body.id}/document`)
      .set("Authorization", authorization)
      .expect(200)
      .expect("Content-Type", /pdf/)
      .expect(response => {
        expect(response.body.length).toBeGreaterThan(1000);
      });

    const proposalOrder = await request(app)
      .post(`/api/v1/sales/proposals/${proposal.body.id}/convert-service-order`)
      .set("Authorization", authorization)
      .send({
        serviceType: "Manutencao preventiva",
        scheduledStart: "2026-07-02T10:00:00.000Z",
        scheduledEnd: "2026-07-02T11:00:00.000Z",
        address: "Rua Orcamento, 456",
        city: "Sao Paulo",
        state: "SP"
      })
      .expect(201)
      .expect(({ body }) => {
        expect(body).toMatchObject({
          tenantId: user.tenantId,
          contactId: contact.id,
          title: "Proposta de manutencao mensal",
          serviceType: "Manutencao preventiva",
          status: "agendada",
          chargedAmount: "1200.00"
        });
      });

    expect(
      await ServiceOrderItem.count({
        where: { serviceOrderId: proposalOrder.body.id, tenantId: user.tenantId }
      })
    ).toBe(2);

    await request(app)
      .get(`/api/v1/portal/proposals/${proposal.body.publicToken}/service-order`)
      .expect(200)
      .expect(({ body }) => {
        expect(body).toMatchObject({
          id: proposalOrder.body.id,
          tenantId: user.tenantId,
          contactId: contact.id
        });
      });

    await request(app)
      .post(`/api/v1/sales/proposals/${proposal.body.id}/convert-service-order`)
      .set("Authorization", authorization)
      .send({ serviceType: "Manutencao preventiva" })
      .expect(409);

    const directOpportunity = await request(app)
      .post("/api/v1/sales/pipeline")
      .set("Authorization", authorization)
      .send({
        contactId: contact.id,
        ownerUserId: user.id,
        title: "Contrato avulso de manutencao",
        stage: "negociacao",
        estimatedValue: 1300,
        expectedCloseDate: "2026-06-30T00:00:00.000Z"
      })
      .expect(201);

    const converted = await request(app)
      .post(`/api/v1/sales/pipeline/${directOpportunity.body.id}/convert-service-order`)
      .set("Authorization", authorization)
      .send({
        serviceType: "Manutencao preventiva",
        scheduledStart: "2026-07-01T10:00:00.000Z",
        scheduledEnd: "2026-07-01T11:00:00.000Z",
        address: "Rua Teste, 123",
        city: "Sao Paulo",
        state: "SP"
      })
      .expect(201)
      .expect(({ body }) => {
        expect(body).toMatchObject({
          tenantId: user.tenantId,
          contactId: contact.id,
          title: "Contrato avulso de manutencao",
          serviceType: "Manutencao preventiva",
          status: "agendada",
          chargedAmount: "1300.00"
        });
      });

    const serviceOrder = await ServiceOrder.findOne({
      where: { id: converted.body.id, tenantId: user.tenantId }
    });
    expect(serviceOrder).toBeTruthy();
    if (!serviceOrder) throw new Error("Service order not found");

    const attendant = await ServiceAttendant.create({
      tenantId: user.tenantId,
      name: "Tecnico Meta",
      email: "tecnico-meta@example.test",
      phone: "11999990000",
      specialty: "Manutencao",
      active: true,
      workingHours: {}
    });
    await serviceOrder.update({
      attendantId: attendant.id,
      status: "concluida",
      completedAt: new Date()
    });

    const periodMonth = new Date().toISOString().slice(0, 7);
    await request(app)
      .post("/api/v1/sales/performance-goals")
      .set("Authorization", authorization)
      .send({
        roleType: "seller",
        userId: user.id,
        periodMonth,
        targetCount: 2,
        targetValue: 2500
      })
      .expect(201);

    await request(app)
      .post("/api/v1/sales/performance-goals")
      .set("Authorization", authorization)
      .send({
        roleType: "technician",
        attendantId: attendant.id,
        periodMonth,
        targetCount: 1,
        targetValue: 1300
      })
      .expect(201);

    await request(app)
      .get(`/api/v1/sales/performance-goals-dashboard?periodMonth=${periodMonth}`)
      .set("Authorization", authorization)
      .expect(200)
      .expect(({ body }) => {
        expect(body.goals).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              roleType: "seller",
              achievedCount: 2,
              achievedValue: 2500
            }),
            expect.objectContaining({
              roleType: "technician",
              achievedCount: 1,
              achievedValue: 1300
            })
          ])
        );
      });

    await request(app)
      .post(`/api/v1/sales/pipeline/${directOpportunity.body.id}/convert-service-order`)
      .set("Authorization", authorization)
      .send({ serviceType: "Manutencao preventiva" })
      .expect(409);

    expect(
      await SalesOpportunityLog.count({
        where: {
          salesOpportunityId: directOpportunity.body.id,
          action: "converted_to_service_order"
        }
      })
    ).toBe(1);

    const approvedProposal = await SalesProposal.findOne({
      where: { id: proposal.body.id, tenantId: user.tenantId }
    });
    expect(approvedProposal?.publicToken).toBe(proposal.body.publicToken);

    await request(app)
      .get("/api/v1/sales/pipeline-dashboard")
      .set("Authorization", authorization)
      .expect(200)
      .expect(({ body }) => {
        expect(body).toMatchObject({
          total: 2,
          open: 0,
          won: 2,
          wonValue: 2500,
          conversionRate: 100
        });
      });
  });
});
