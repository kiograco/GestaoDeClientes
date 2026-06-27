import request from "supertest";
import AuditLog from "../../src/models/AuditLog";
import BaseRegister from "../../src/models/BaseRegister";
import Pest from "../../src/models/Pest";
import ProductPest from "../../src/models/ProductPest";
import ServiceAttendant from "../../src/models/ServiceAttendant";
import ServiceInventoryBatch from "../../src/models/ServiceInventoryBatch";
import ServiceInventoryItem from "../../src/models/ServiceInventoryItem";
import ServiceInventoryMovement from "../../src/models/ServiceInventoryMovement";
import ServiceInventoryPestRecommendation from "../../src/models/ServiceInventoryPestRecommendation";
import ServiceOrder from "../../src/models/ServiceOrder";
import ServicePest from "../../src/models/ServicePest";
import ServiceRa from "../../src/models/ServiceRa";
import ServiceTeam from "../../src/models/ServiceTeam";
import ServiceTeamAttendant from "../../src/models/ServiceTeamAttendant";
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
  it("valida situacao de OS pelo cadastro parametrizado da empresa", async () => {
    const app = await makeTestApp();
    const user = await createAdminUser();
    const authorization = bearerTokenFor(user);
    const contact = await createContact({ tenantId: user.tenantId });

    await BaseRegister.create({
      tenantId: user.tenantId,
      module: "service-order-statuses",
      code: "aguardando_cliente",
      name: "Aguardando cliente",
      status: "active",
      data: {}
    });

    await request(app)
      .post("/service/orders")
      .set("Authorization", authorization)
      .send({
        contactId: contact.id,
        title: "Visita com situacao parametrizada",
        serviceType: "Manutencao",
        priority: "media",
        status: "aguardando_cliente",
        scheduledStart: "2026-09-11T13:00:00.000Z",
        scheduledEnd: "2026-09-11T14:00:00.000Z",
        items: []
      })
      .expect(201)
      .expect(({ body }) => {
        expect(body.status).toBe("aguardando_cliente");
      });

    await request(app)
      .post("/service/orders")
      .set("Authorization", authorization)
      .send({
        contactId: contact.id,
        title: "Visita com situacao invalida",
        serviceType: "Manutencao",
        priority: "media",
        status: "status_fora_do_cadastro",
        scheduledStart: "2026-09-12T13:00:00.000Z",
        scheduledEnd: "2026-09-12T14:00:00.000Z",
        items: []
      })
      .expect(400);
  });

  it("exporta ordens de servico em CSV respeitando filtros e tenant", async () => {
    const app = await makeTestApp();
    const user = await createAdminUser();
    const otherUser = await createAdminUser();
    const authorization = bearerTokenFor(user);
    const contact = await createContact({ tenantId: user.tenantId });
    const otherContact = await createContact({ tenantId: otherUser.tenantId });

    await request(app)
      .post("/service/orders")
      .set("Authorization", authorization)
      .send({
        contactId: contact.id,
        title: "Exportar OS agendada",
        serviceType: "Manutencao",
        priority: "media",
        status: "agendada",
        scheduledStart: "2026-09-13T13:00:00.000Z",
        scheduledEnd: "2026-09-13T14:00:00.000Z",
        items: []
      })
      .expect(201);

    await request(app)
      .post("/service/orders")
      .set("Authorization", authorization)
      .send({
        contactId: contact.id,
        title: "Nao deve exportar cancelada",
        serviceType: "Manutencao",
        priority: "media",
        status: "cancelada",
        scheduledStart: "2026-09-14T13:00:00.000Z",
        scheduledEnd: "2026-09-14T14:00:00.000Z",
        items: []
      })
      .expect(201);

    await ServiceOrder.create({
      tenantId: otherUser.tenantId,
      contactId: otherContact.id,
      createdByUserId: otherUser.id,
      title: "OS de outro tenant",
      serviceType: "Manutencao",
      priority: "media",
      status: "agendada"
    });

    await request(app)
      .get("/service/orders/export")
      .query({ status: "agendada" })
      .set("Authorization", authorization)
      .expect(200)
      .expect("Content-Type", /text\/csv/)
      .expect(response => {
        const csv = response.text;
        expect(csv).toContain("Exportar OS agendada");
        expect(csv).not.toContain("Nao deve exportar cancelada");
        expect(csv).not.toContain("OS de outro tenant");
      });
  });

  it("pagina e ordena ordens de servico no servidor", async () => {
    const app = await makeTestApp();
    const user = await createAdminUser();
    const authorization = bearerTokenFor(user);
    const contact = await createContact({ tenantId: user.tenantId });

    await request(app)
      .post("/service/orders")
      .set("Authorization", authorization)
      .send({
        contactId: contact.id,
        title: "OS pagina B",
        serviceType: "Manutencao",
        priority: "media",
        status: "agendada",
        scheduledStart: "2026-09-20T13:00:00.000Z",
        scheduledEnd: "2026-09-20T14:00:00.000Z",
        items: []
      })
      .expect(201);

    await request(app)
      .post("/service/orders")
      .set("Authorization", authorization)
      .send({
        contactId: contact.id,
        title: "OS pagina A",
        serviceType: "Manutencao",
        priority: "media",
        status: "agendada",
        scheduledStart: "2026-09-19T13:00:00.000Z",
        scheduledEnd: "2026-09-19T14:00:00.000Z",
        items: []
      })
      .expect(201);

    await request(app)
      .get("/service/orders")
      .query({
        pageNumber: 1,
        rowsPerPage: 1,
        sortBy: "scheduledStart",
        status: "agendada"
      })
      .set("Authorization", authorization)
      .expect(200)
      .expect(({ body }) => {
        expect(body.count).toBe(2);
        expect(body.hasMore).toBe(true);
        expect(body.rows).toHaveLength(1);
        expect(body.rows[0].title).toBe("OS pagina A");
      });
  });

  it("aplica permissoes por perfil nas operacoes da agenda", async () => {
    const app = await makeTestApp();
    const admin = await createAdminUser();
    const contact = await createContact({ tenantId: admin.tenantId });
    const attendant = await createAgentUser({
      tenantId: admin.tenantId,
      profile: "atendente"
    });
    const technician = await createAgentUser({
      tenantId: admin.tenantId,
      profile: "tecnico"
    });
    const basicUser = await createAgentUser({ tenantId: admin.tenantId });
    const attendantAuthorization = bearerTokenFor(attendant);
    const technicianAuthorization = bearerTokenFor(technician);
    const order = {
      contactId: contact.id,
      title: "Visita operacional",
      serviceType: "Manutencao",
      priority: "media",
      status: "agendada",
      scheduledStart: "2026-09-10T13:00:00.000Z",
      scheduledEnd: "2026-09-10T14:00:00.000Z",
      items: []
    };

    const created = await request(app)
      .post("/service/orders")
      .set("Authorization", attendantAuthorization)
      .send(order)
      .expect(201);

    await request(app)
      .put(`/service/orders/${created.body.id}`)
      .set("Authorization", attendantAuthorization)
      .send({ ...order, status: "em_atendimento" })
      .expect(200);

    await request(app)
      .get("/service/orders")
      .set("Authorization", technicianAuthorization)
      .expect(200);
    await request(app)
      .get("/service/orders-dashboard")
      .set("Authorization", attendantAuthorization)
      .expect(200);
    await request(app)
      .get("/service/orders/export")
      .set("Authorization", technicianAuthorization)
      .expect(403);
    await request(app)
      .post("/service/orders")
      .set("Authorization", technicianAuthorization)
      .send({ ...order, title: "Criacao indevida" })
      .expect(403);
    await request(app)
      .put(`/service/orders/${created.body.id}`)
      .set("Authorization", technicianAuthorization)
      .send({ ...order, status: "concluida" })
      .expect(403);
    await request(app)
      .post("/service/attendants")
      .set("Authorization", technicianAuthorization)
      .send({ name: "Tecnico indevido", active: true })
      .expect(403);
    await request(app)
      .get("/service/orders")
      .set("Authorization", bearerTokenFor(basicUser))
      .expect(403);
  });

  it("aplica permissoes granulares configuradas no usuario", async () => {
    const app = await makeTestApp();
    const tenantUser = await createAgentUser({
      configs: { permissions: ["service-orders:view"] }
    });
    const authorization = bearerTokenFor(tenantUser);
    const contact = await createContact({ tenantId: tenantUser.tenantId });

    await request(app)
      .get("/service/orders")
      .set("Authorization", authorization)
      .expect(200);

    await request(app)
      .post("/service/orders")
      .set("Authorization", authorization)
      .send({
        contactId: contact.id,
        title: "Criacao sem permissao",
        serviceType: "Manutencao",
        priority: "media",
        status: "agendada",
        scheduledStart: "2026-09-15T13:00:00.000Z",
        scheduledEnd: "2026-09-15T14:00:00.000Z",
        items: []
      })
      .expect(403);
  });

  it("gerencia equipes de atendimento com isolamento por tenant", async () => {
    const app = await makeTestApp();
    const user = await createAdminUser();
    const otherUser = await createAdminUser();
    const authorization = bearerTokenFor(user);
    const attendant = await ServiceAttendant.create({
      tenantId: user.tenantId,
      name: "Tecnico Equipe",
      email: "tecnico-equipe@example.test",
      active: true
    });
    const otherTeam = await ServiceTeam.create({
      tenantId: otherUser.tenantId,
      name: "Equipe de outro tenant",
      code: "EXT",
      isActive: true
    });

    const created = await request(app)
      .post("/service/teams")
      .set("Authorization", authorization)
      .send({
        name: "Equipe Norte",
        code: "NORTE",
        responsibleId: attendant.id,
        attendantIds: [attendant.id],
        isActive: true
      })
      .expect(201)
      .expect(({ body }) => {
        expect(body.name).toBe("Equipe Norte");
        expect(body.tenantId).toBe(user.tenantId);
      });

    expect(
      await ServiceTeamAttendant.count({
        where: {
          tenantId: user.tenantId,
          serviceTeamId: created.body.id,
          serviceAttendantId: attendant.id
        }
      })
    ).toBe(1);

    await request(app)
      .get("/service/teams")
      .set("Authorization", authorization)
      .expect(200)
      .expect(({ body }) => {
        expect(body.map((team: { id: number }) => team.id)).toContain(
          created.body.id
        );
        expect(body.map((team: { id: number }) => team.id)).not.toContain(
          otherTeam.id
        );
      });
  });

  it("bloqueia agenda quando ha conflito por equipe mesmo com outro tecnico", async () => {
    const app = await makeTestApp();
    const user = await createAdminUser();
    const authorization = bearerTokenFor(user);
    const contact = await createContact({ tenantId: user.tenantId });
    const firstAttendant = await ServiceAttendant.create({
      tenantId: user.tenantId,
      name: "Tecnico Equipe A",
      email: "tecnico-equipe-a@example.test",
      active: true
    });
    const secondAttendant = await ServiceAttendant.create({
      tenantId: user.tenantId,
      name: "Tecnico Equipe B",
      email: "tecnico-equipe-b@example.test",
      active: true
    });
    const team = await ServiceTeam.create({
      tenantId: user.tenantId,
      name: "Equipe Conflito",
      code: "CONFLITO",
      isActive: true
    });

    await request(app)
      .post("/service/orders")
      .set("Authorization", authorization)
      .send({
        contactId: contact.id,
        attendantId: firstAttendant.id,
        serviceTeamId: team.id,
        title: "Visita da equipe",
        serviceType: "Manutencao",
        priority: "media",
        status: "agendada",
        scheduledStart: "2026-10-01T09:00:00.000Z",
        scheduledEnd: "2026-10-01T10:00:00.000Z",
        items: []
      })
      .expect(201);

    await request(app)
      .post("/service/orders")
      .set("Authorization", authorization)
      .send({
        contactId: contact.id,
        attendantId: secondAttendant.id,
        serviceTeamId: team.id,
        title: "Visita conflitante por equipe",
        serviceType: "Manutencao",
        priority: "media",
        status: "agendada",
        scheduledStart: "2026-10-01T09:30:00.000Z",
        scheduledEnd: "2026-10-01T10:30:00.000Z",
        items: []
      })
      .expect(409);
  });

  it.each([
    ["daily", "2026-10-06T09:00:00.000Z", "2026-10-07T09:00:00.000Z"],
    ["weekly", "2026-10-12T09:00:00.000Z", "2026-10-19T09:00:00.000Z"],
    ["biweekly", "2026-10-19T09:00:00.000Z", "2026-11-02T09:00:00.000Z"]
  ])(
    "materializa recorrencia %s como ordens independentes",
    async (recurrenceType, expectedSecond, expectedThird) => {
      const app = await makeTestApp();
      const user = await createAdminUser();
      const authorization = bearerTokenFor(user);
      const contact = await createContact({ tenantId: user.tenantId });

      const created = await request(app)
        .post("/service/orders")
        .set("Authorization", authorization)
        .send({
          contactId: contact.id,
          title: `Serie ${recurrenceType}`,
          serviceType: "Manutencao",
          priority: "media",
          status: "agendada",
          scheduledStart: "2026-10-05T09:00:00.000Z",
          scheduledEnd: "2026-10-05T10:00:00.000Z",
          recurrenceType,
          recurrenceActive: true,
          recurrenceMaxOccurrences: 3,
          recurrenceWeekdays: [1],
          items: []
        })
        .expect(201);

      const children = await ServiceOrder.findAll({
        where: {
          tenantId: user.tenantId,
          recurrenceParentId: created.body.id
        },
        order: [["occurrenceNumber", "ASC"]]
      });

      expect(children).toHaveLength(2);
      expect(children.map(order => order.scheduledStart?.toISOString())).toEqual(
        [expectedSecond, expectedThird]
      );
      expect(children.map(order => order.occurrenceNumber)).toEqual([2, 3]);
      expect(children.every(order => order.recurrenceType === "single")).toBe(
        true
      );
    }
  );

  it("cria estrutura formal de RA vinculada a ordem de servico", async () => {
    const app = await makeTestApp();
    const user = await createAdminUser();
    const authorization = bearerTokenFor(user);
    const contact = await createContact({ tenantId: user.tenantId });
    const attendant = await ServiceAttendant.create({
      tenantId: user.tenantId,
      name: "Tecnico RA",
      email: "tecnico-ra@example.test",
      active: true
    });
    const team = await ServiceTeam.create({
      tenantId: user.tenantId,
      name: "Equipe RA",
      code: "RA",
      isActive: true
    });

    const created = await request(app)
      .post("/service/orders")
      .set("Authorization", authorization)
      .send({
        contactId: contact.id,
        attendantId: attendant.id,
        serviceTeamId: team.id,
        title: "Atendimento RA",
        serviceType: "Inspecao",
        priority: "alta",
        status: "agendada",
        scheduledStart: "2026-10-08T09:00:00.000Z",
        scheduledEnd: "2026-10-08T10:00:00.000Z",
        isRaService: true,
        items: []
      })
      .expect(201);

    const serviceRa = await ServiceRa.findOne({
      where: { tenantId: user.tenantId, serviceOrderId: created.body.id }
    });

    expect(serviceRa).toEqual(
      expect.objectContaining({
        tenantId: user.tenantId,
        contactId: contact.id,
        serviceOrderId: created.body.id,
        attendantId: attendant.id,
        serviceTeamId: team.id,
        status: "pending_definition"
      })
    );
  });

  it("rejeita conflito com ocorrencia futura de ordem recorrente", async () => {
    const app = await makeTestApp();
    const user = await createAdminUser();
    const authorization = bearerTokenFor(user);
    const contact = await createContact({ tenantId: user.tenantId });
    const attendant = await ServiceAttendant.create({
      tenantId: user.tenantId,
      name: "Tecnico Recorrencia",
      email: "tecnico-recorrencia@example.test",
      active: true
    });
    const basePayload = {
      contactId: contact.id,
      attendantId: attendant.id,
      title: "Manutencao recorrente",
      serviceType: "Manutencao",
      priority: "media",
      status: "agendada",
      scheduledStart: "2026-06-01T09:00:00.000Z",
      scheduledEnd: "2026-06-01T10:00:00.000Z",
      recurrenceType: "custom_interval",
      recurrenceActive: true,
      recurrenceIntervalDays: 30,
      items: []
    };

    await request(app)
      .post("/service/orders")
      .set("Authorization", authorization)
      .send(basePayload)
      .expect(201);

    await request(app)
      .post("/service/orders")
      .set("Authorization", authorization)
      .send({
        ...basePayload,
        title: "Visita conflitante",
        recurrenceType: "single",
        recurrenceActive: false,
        recurrenceIntervalDays: null,
        scheduledStart: "2026-07-01T09:30:00.000Z",
        scheduledEnd: "2026-07-01T10:30:00.000Z"
      })
      .expect(409);

    await request(app)
      .post("/service/orders")
      .set("Authorization", authorization)
      .send({
        ...basePayload,
        title: "Visita adjacente",
        recurrenceType: "single",
        recurrenceActive: false,
        recurrenceIntervalDays: null,
        scheduledStart: "2026-07-01T10:00:00.000Z",
        scheduledEnd: "2026-07-01T11:00:00.000Z"
      })
      .expect(201);
  });

  it("altera uma ocorrencia recorrente sem deslocar a serie base", async () => {
    const app = await makeTestApp();
    const user = await createAdminUser();
    const authorization = bearerTokenFor(user);
    const contact = await createContact({ tenantId: user.tenantId });
    const attendant = await ServiceAttendant.create({
      tenantId: user.tenantId,
      name: "Tecnico Excecao",
      email: "tecnico-excecao@example.test",
      active: true
    });
    const replacementAttendant = await ServiceAttendant.create({
      tenantId: user.tenantId,
      name: "Tecnico Excecao B",
      email: "tecnico-excecao-b@example.test",
      active: true
    });
    const { body: recurringOrder } = await request(app)
      .post("/service/orders")
      .set("Authorization", authorization)
      .send({
        contactId: contact.id,
        attendantId: attendant.id,
        title: "Manutencao recorrente",
        serviceType: "Manutencao",
        priority: "media",
        status: "agendada",
        scheduledStart: "2026-06-01T09:00:00.000Z",
        scheduledEnd: "2026-06-01T10:00:00.000Z",
        recurrenceType: "custom_interval",
        recurrenceActive: true,
        recurrenceIntervalDays: 30,
        items: []
      })
      .expect(201);

    await request(app)
      .patch(`/service/orders/${recurringOrder.id}/occurrence`)
      .set("Authorization", authorization)
      .send({
        occurrenceStart: "2026-07-01T09:00:00.000Z",
        scheduledStart: "2026-07-01T14:00:00.000Z",
        scheduledEnd: "2026-07-01T15:00:00.000Z",
        attendantId: replacementAttendant.id,
        status: "reagendada"
      })
      .expect(200)
      .expect(({ body }) => {
        expect(body).toMatchObject({
          id: recurringOrder.id,
          recurringOccurrence: true,
          originalOccurrenceStart: "2026-07-01T09:00:00.000Z",
          scheduledStart: "2026-07-01T14:00:00.000Z",
          scheduledEnd: "2026-07-01T15:00:00.000Z",
          status: "reagendada"
        });
        expect(body.occurrenceExceptionId).toBeTruthy();
      });

    await request(app)
      .get("/service/orders")
      .query({
        start: "2026-07-01T00:00:00.000Z",
        end: "2026-07-02T00:00:00.000Z"
      })
      .set("Authorization", authorization)
      .expect(200)
      .expect(({ body }) => {
        expect(body).toEqual([
          expect.objectContaining({
            id: recurringOrder.id,
            originalOccurrenceStart: "2026-07-01T09:00:00.000Z",
            scheduledStart: "2026-07-01T14:00:00.000Z",
            scheduledEnd: "2026-07-01T15:00:00.000Z"
          })
        ]);
      });

    await request(app)
      .get("/service/orders")
      .query({
        start: "2026-07-01T00:00:00.000Z",
        end: "2026-07-02T00:00:00.000Z",
        attendantId: replacementAttendant.id
      })
      .set("Authorization", authorization)
      .expect(200)
      .expect(({ body }) => expect(body).toHaveLength(1));
    await request(app)
      .get("/service/orders")
      .query({
        start: "2026-07-01T00:00:00.000Z",
        end: "2026-07-02T00:00:00.000Z",
        attendantId: attendant.id
      })
      .set("Authorization", authorization)
      .expect(200)
      .expect(({ body }) => expect(body).toHaveLength(0));

    const persistedOrder = await ServiceOrder.findByPk(recurringOrder.id);
    expect(persistedOrder?.scheduledStart.toISOString()).toBe(
      "2026-06-01T09:00:00.000Z"
    );
  });

  it("rejeita conflito com ocorrencia recorrente reagendada por excecao", async () => {
    const app = await makeTestApp();
    const user = await createAdminUser();
    const authorization = bearerTokenFor(user);
    const contact = await createContact({ tenantId: user.tenantId });
    const attendant = await ServiceAttendant.create({
      tenantId: user.tenantId,
      name: "Tecnico Excecao Conflito",
      email: "tecnico-excecao-conflito@example.test",
      active: true
    });
    const { body: recurringOrder } = await request(app)
      .post("/service/orders")
      .set("Authorization", authorization)
      .send({
        contactId: contact.id,
        attendantId: attendant.id,
        title: "Manutencao recorrente com excecao",
        serviceType: "Manutencao",
        priority: "media",
        status: "agendada",
        scheduledStart: "2026-06-01T09:00:00.000Z",
        scheduledEnd: "2026-06-01T10:00:00.000Z",
        recurrenceType: "custom_interval",
        recurrenceActive: true,
        recurrenceIntervalDays: 30,
        items: []
      })
      .expect(201);

    await request(app)
      .patch(`/service/orders/${recurringOrder.id}/occurrence`)
      .set("Authorization", authorization)
      .send({
        occurrenceStart: "2026-07-01T09:00:00.000Z",
        scheduledStart: "2026-07-01T14:00:00.000Z",
        scheduledEnd: "2026-07-01T15:00:00.000Z",
        attendantId: attendant.id,
        status: "reagendada"
      })
      .expect(200);

    await request(app)
      .post("/service/orders")
      .set("Authorization", authorization)
      .send({
        contactId: contact.id,
        attendantId: attendant.id,
        title: "Visita conflitante com excecao",
        serviceType: "Manutencao",
        priority: "media",
        status: "agendada",
        scheduledStart: "2026-07-01T14:30:00.000Z",
        scheduledEnd: "2026-07-01T15:30:00.000Z",
        items: []
      })
      .expect(409)
      .expect(({ body }) => {
        expect(body.error).toBe("ERR_SERVICE_ORDER_SCHEDULE_CONFLICT");
      });

    await request(app)
      .post("/service/orders")
      .set("Authorization", authorization)
      .send({
        contactId: contact.id,
        attendantId: attendant.id,
        title: "Visita adjacente a excecao",
        serviceType: "Manutencao",
        priority: "media",
        status: "agendada",
        scheduledStart: "2026-07-01T15:00:00.000Z",
        scheduledEnd: "2026-07-01T16:00:00.000Z",
        items: []
      })
      .expect(201);
  });

  it("atualiza acoes rapidas sem sobrescrever campos nao enviados", async () => {
    const app = await makeTestApp();
    const user = await createAdminUser();
    const authorization = bearerTokenFor(user);
    const contact = await createContact({ tenantId: user.tenantId });
    const attendant = await ServiceAttendant.create({
      tenantId: user.tenantId,
      name: "Tecnico Patch",
      email: "tecnico-patch@example.test",
      active: true
    });
    const replacementAttendant = await ServiceAttendant.create({
      tenantId: user.tenantId,
      name: "Tecnico Patch B",
      email: "tecnico-patch-b@example.test",
      active: true
    });
    const inventoryItem = await ServiceInventoryItem.create({
      tenantId: user.tenantId,
      name: "Produto preservado no patch",
      unit: "unidade",
      quantity: 5,
      minQuantity: 1,
      costPrice: 12.5,
      salePrice: 35.9,
      active: true
    });

    const { body: created } = await request(app)
      .post("/service/orders")
      .set("Authorization", authorization)
      .send({
        ...orderPayload(contact.id, inventoryItem.id, 1, "agendada"),
        attendantId: attendant.id,
        financialStatus: "cobrado",
        paymentMethod: "pix",
        chargedAmount: 150,
        paidAmount: 50,
        paymentDueDate: "2099-06-20T00:00:00.000Z",
        financialObservation: "Pagamento parcial combinado"
      })
      .expect(201);

    await request(app)
      .patch(`/service/orders/${created.id}`)
      .set("Authorization", authorization)
      .send({
        attendantId: replacementAttendant.id,
        status: "reagendada",
        expectedUpdatedAt: created.updatedAt
      })
      .expect(200)
      .expect(({ body }) => {
        expect(body).toMatchObject({
          id: created.id,
          title: "Instalacao com produto",
          serviceType: "Instalacao",
          status: "reagendada",
          attendantId: replacementAttendant.id,
          financialStatus: "cobrado",
          paymentMethod: "pix",
          chargedAmount: "150.00",
          paidAmount: "50.00",
          financialObservation: "Pagamento parcial combinado"
        });
        expect(body.items).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ itemType: "service" }),
            expect.objectContaining({
              itemType: "product",
              inventoryItemId: inventoryItem.id,
              quantity: 1
            })
          ])
        );
      });

    await request(app)
      .patch(`/service/orders/${created.id}`)
      .set("Authorization", authorization)
      .send({
        status: "em_atendimento",
        expectedUpdatedAt: created.updatedAt
      })
      .expect(409)
      .expect(({ body }) => {
        expect(body.error).toBe("ERR_SERVICE_ORDER_STALE_VERSION");
      });
  });

  it("audita baixa automatica de estoque ao concluir por acao rapida", async () => {
    const app = await makeTestApp();
    const user = await createAdminUser();
    const authorization = bearerTokenFor(user);
    const contact = await createContact({ tenantId: user.tenantId });
    const inventoryItem = await ServiceInventoryItem.create({
      tenantId: user.tenantId,
      name: "Produto auditado no patch",
      unit: "unidade",
      quantity: 5,
      minQuantity: 1,
      costPrice: 10,
      salePrice: 30,
      active: true
    });

    const { body: created } = await request(app)
      .post("/service/orders")
      .set("Authorization", authorization)
      .send(orderPayload(contact.id, inventoryItem.id, 2, "agendada"))
      .expect(201);

    await request(app)
      .patch(`/service/orders/${created.id}`)
      .set("Authorization", authorization)
      .send({
        status: "concluida",
        expectedUpdatedAt: created.updatedAt
      })
      .expect(200)
      .expect(({ body }) => {
        expect(body.status).toBe("concluida");
        expect(body.inventoryDeductedAt).toBeTruthy();
      });

    await inventoryItem.reload();
    expect(inventoryItem.quantity).toBe(3);
    expect(await ServiceInventoryMovement.count()).toBe(1);
    const auditLog = await AuditLog.findOne({
      where: {
        action: "service_inventory_auto_deducted",
        resource: "service_inventory",
        resourceId: String(created.id)
      }
    });

    expect(auditLog).toMatchObject({
      tenantId: user.tenantId,
      userId: user.id
    });
    expect(auditLog?.metadata).toMatchObject({
      serviceOrderId: created.id,
      productItems: 1
    });
  });

  it("audita falha de baixa de estoque ao concluir por acao rapida", async () => {
    const app = await makeTestApp();
    const user = await createAdminUser();
    const authorization = bearerTokenFor(user);
    const contact = await createContact({ tenantId: user.tenantId });
    const inventoryItem = await ServiceInventoryItem.create({
      tenantId: user.tenantId,
      name: "Produto sem saldo no patch",
      unit: "unidade",
      quantity: 1,
      minQuantity: 1,
      costPrice: 10,
      salePrice: 30,
      active: true
    });

    const { body: created } = await request(app)
      .post("/service/orders")
      .set("Authorization", authorization)
      .send(orderPayload(contact.id, inventoryItem.id, 2, "agendada"))
      .expect(201);

    await request(app)
      .patch(`/service/orders/${created.id}`)
      .set("Authorization", authorization)
      .send({
        status: "concluida",
        expectedUpdatedAt: created.updatedAt
      })
      .expect(409)
      .expect(({ body }) => {
        expect(body.error).toContain(
          "Estoque insuficiente para Produto sem saldo no patch"
        );
      });

    await inventoryItem.reload();
    expect(inventoryItem.quantity).toBe(1);
    expect(await ServiceInventoryMovement.count()).toBe(0);
    const auditLog = await AuditLog.findOne({
      where: {
        action: "service_inventory_auto_deduct_failed",
        resource: "service_inventory",
        resourceId: String(created.id)
      }
    });

    expect(auditLog).toMatchObject({
      tenantId: user.tenantId,
      userId: user.id
    });
    expect(auditLog?.metadata).toMatchObject({
      serviceOrderId: String(created.id)
    });
    expect(String(auditLog?.metadata.reason)).toContain(
      "Estoque insuficiente para Produto sem saldo no patch"
    );
  });

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
    const dueSoonPaymentDueDate = new Date(
      Date.now() + 3 * 24 * 60 * 60 * 1000
    ).toISOString();
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
        paymentDueDate: dueSoonPaymentDueDate,
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
