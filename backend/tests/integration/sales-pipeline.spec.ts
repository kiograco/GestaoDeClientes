import request from "supertest";
import SalesOpportunityLog from "../../src/models/SalesOpportunityLog";
import ServiceOrder from "../../src/models/ServiceOrder";
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
      .post("/sales/pipeline")
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
      .post("/sales/pipeline")
      .set("Authorization", bearerTokenFor(otherUser))
      .send({
        contactId: otherContact.id,
        ownerUserId: otherUser.id,
        title: "Oportunidade outro tenant",
        stage: "novo",
        estimatedValue: 800
      })
      .expect(201);

    await request(app)
      .put(`/sales/pipeline/${created.body.id}`)
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
      .get("/sales/pipeline")
      .set("Authorization", authorization)
      .expect(200)
      .expect(({ body }) => {
        expect(body).toHaveLength(1);
        expect(body[0]).toMatchObject({ id: created.body.id });
      });

    await request(app)
      .get("/sales/pipeline-dashboard")
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

    const converted = await request(app)
      .post(`/sales/pipeline/${created.body.id}/convert-service-order`)
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
          title: "Contrato mensal de manutencao",
          serviceType: "Manutencao preventiva",
          status: "agendada",
          chargedAmount: "1300.00"
        });
      });

    const serviceOrder = await ServiceOrder.findOne({
      where: { id: converted.body.id, tenantId: user.tenantId }
    });
    expect(serviceOrder).toBeTruthy();

    await request(app)
      .post(`/sales/pipeline/${created.body.id}/convert-service-order`)
      .set("Authorization", authorization)
      .send({ serviceType: "Manutencao preventiva" })
      .expect(409);

    expect(
      await SalesOpportunityLog.count({
        where: {
          salesOpportunityId: created.body.id,
          action: "converted_to_service_order"
        }
      })
    ).toBe(1);

    await request(app)
      .get("/sales/pipeline-dashboard")
      .set("Authorization", authorization)
      .expect(200)
      .expect(({ body }) => {
        expect(body).toMatchObject({
          total: 1,
          open: 0,
          won: 1,
          wonValue: 1300,
          conversionRate: 100
        });
      });
  });
});
