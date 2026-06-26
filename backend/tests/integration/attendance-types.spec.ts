import request from "supertest";
import { makeTestApp } from "../helpers/app";
import { bearerTokenFor } from "../helpers/auth";
import {
  createAdminUser,
  createAgentUser,
  createContact,
  createTenant
} from "../factories";
import AttendanceType from "../../src/models/AttendanceType";
import ServiceOrder from "../../src/models/ServiceOrder";
import Ticket from "../../src/models/Ticket";

describe("attendance types API", () => {
  it("cria, edita e lista tipos de atendimento por empresa", async () => {
    const app = await makeTestApp();
    const userA = await createAdminUser();
    const userB = await createAdminUser();

    const created = await request(app)
      .post("/attendance-types")
      .set("Authorization", bearerTokenFor(userA))
      .send({ name: "Preventivo", description: "Visita preventiva" })
      .expect(201);

    await request(app)
      .post("/attendance-types")
      .set("Authorization", bearerTokenFor(userB))
      .send({ name: "Preventivo" })
      .expect(201);

    await request(app)
      .put(`/attendance-types/${created.body.id}`)
      .set("Authorization", bearerTokenFor(userA))
      .send({ name: "Preventivo Programado", isActive: true })
      .expect(200);

    const response = await request(app)
      .get("/attendance-types")
      .set("Authorization", bearerTokenFor(userA))
      .expect(200);

    expect(response.body.rows).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: "Preventivo Programado" })
      ])
    );
    expect(response.body.rows).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ tenantId: userB.tenantId })])
    );
  });

  it("bloqueia duplicidade na mesma empresa", async () => {
    const app = await makeTestApp();
    const user = await createAdminUser();

    await request(app)
      .post("/attendance-types")
      .set("Authorization", bearerTokenFor(user))
      .send({ name: "Garantia" })
      .expect(201);

    await request(app)
      .post("/attendance-types")
      .set("Authorization", bearerTokenFor(user))
      .send({ name: "garantia" })
      .expect(409);
  });

  it("bloqueia escrita para usuario sem permissao de cadastro", async () => {
    const app = await makeTestApp();
    const tenant = await createTenant();
    const user = await createAgentUser({ tenantId: tenant.id });

    await request(app)
      .post("/attendance-types")
      .set("Authorization", bearerTokenFor(user))
      .send({ name: "Emergencial" })
      .expect(403);
  });

  it("inativa quando existe vinculo com ordem de servico", async () => {
    const app = await makeTestApp();
    const user = await createAdminUser();
    const contact = await createContact({ tenantId: user.tenantId });
    const attendanceType = await AttendanceType.create({
      tenantId: user.tenantId,
      name: "Monitoramento",
      isActive: true
    });

    await ServiceOrder.create({
      tenantId: user.tenantId,
      contactId: contact.id,
      createdByUserId: user.id,
      title: "OS vinculada",
      serviceType: "Monitoramento",
      priority: "baixa",
      status: "rascunho"
    });

    await request(app)
      .delete(`/attendance-types/${attendanceType.id}`)
      .set("Authorization", bearerTokenFor(user))
      .expect(200)
      .expect(({ body }) => {
        expect(body.inactivated).toBe(true);
      });

    await attendanceType.reload();
    expect(attendanceType.isActive).toBe(false);
  });

  it("inativa quando existe vinculo formal por attendanceTypeId", async () => {
    const app = await makeTestApp();
    const user = await createAdminUser();
    const contact = await createContact({ tenantId: user.tenantId });
    const attendanceType = await AttendanceType.create({
      tenantId: user.tenantId,
      name: "Emergencial",
      isActive: true
    });

    await ServiceOrder.create({
      tenantId: user.tenantId,
      contactId: contact.id,
      createdByUserId: user.id,
      title: "OS formal",
      attendanceTypeId: attendanceType.id,
      serviceType: "Emergencial",
      priority: "alta",
      status: "rascunho"
    });
    await Ticket.create({
      tenantId: user.tenantId,
      contactId: contact.id,
      status: "pending",
      unreadMessages: 0,
      lastMessage: "Atendimento emergencial",
      channel: "whatsapp",
      attendanceTypeId: attendanceType.id
    });

    await request(app)
      .delete(`/attendance-types/${attendanceType.id}`)
      .set("Authorization", bearerTokenFor(user))
      .expect(200)
      .expect(({ body }) => {
        expect(body.inactivated).toBe(true);
      });

    await attendanceType.reload();
    expect(attendanceType.isActive).toBe(false);
  });
});
