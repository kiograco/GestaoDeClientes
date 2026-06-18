import request from "supertest";
import MonitoringPoint from "../../src/models/MonitoringPoint";
import MonitoringPointHistory from "../../src/models/MonitoringPointHistory";
import MonitoringPointMapHistory from "../../src/models/MonitoringPointMapHistory";
import ClientFloorPlan from "../../src/models/ClientFloorPlan";
import TrapType from "../../src/models/TrapType";
import { bearerTokenFor } from "../helpers/auth";
import { makeTestApp } from "../helpers/app";
import { createAdminUser } from "../factories";

const clientPayload = () => ({
  registrationType: "legal_entity",
  legalName: "Cliente Monitoramento Ltda",
  document: "44555666000177",
  status: "active",
  addresses: [
    {
      addressType: "Unidade",
      zipCode: "01001000",
      street: "Praca da Se",
      number: "100",
      district: "Se",
      city: "Sao Paulo",
      state: "SP"
    }
  ],
  areas: [
    {
      addressIndex: 0,
      name: "Cozinha",
      areaType: "Alimentos",
      services: ["Monitoramento"],
      sectors: [{ name: "Bancada" }, { name: "Camara Fria" }]
    }
  ],
  contacts: []
});

describe("monitoring API", () => {
  it("gerencia tipos, gera pontos por faixa e registra historico por tenant", async () => {
    const app = await makeTestApp();
    const user = await createAdminUser();
    const otherUser = await createAdminUser();
    const authorization = bearerTokenFor(user);

    const client = await request(app)
      .post("/clients")
      .set("Authorization", authorization)
      .send(clientPayload())
      .expect(201);

    const address = client.body.addresses[0];
    const area = address.areas[0];
    const [sector, otherSector] = area.sectors;

    const trapType = await request(app)
      .post("/monitoring/trap-types")
      .set("Authorization", authorization)
      .send({
        name: "Porta Isca",
        code: "PI",
        type: "Roedores",
        description: "Ponto de iscagem protegido",
        active: true
      })
      .expect(201)
      .expect(({ body }) => {
        expect(body).toMatchObject({
          tenantId: user.tenantId,
          name: "Porta Isca",
          code: "PI",
          active: true
        });
      });

    await request(app)
      .post("/monitoring/trap-types")
      .set("Authorization", authorization)
      .send({
        name: "Codigo duplicado",
        code: "PI",
        type: "Roedores"
      })
      .expect(409);

    await request(app)
      .post("/monitoring/points")
      .set("Authorization", bearerTokenFor(otherUser))
      .send({
        clientId: client.body.id,
        addressId: address.id,
        areaId: area.id,
        sectorId: sector.id,
        trapTypeId: trapType.body.id,
        owner: "company",
        installedAt: "2026-06-15",
        initialNumber: 1,
        finalNumber: 1
      })
      .expect(404);

    const createdPoints = await request(app)
      .post("/monitoring/points")
      .set("Authorization", authorization)
      .send({
        clientId: client.body.id,
        addressId: address.id,
        areaId: area.id,
        sectorId: sector.id,
        trapTypeId: trapType.body.id,
        owner: "company",
        installedAt: "2026-06-15",
        initialNumber: 1,
        finalNumber: 3,
        markerColor: "#123456",
        markerIconUrl: "https://example.test/trap.png",
        markerType: "icon",
        notes: "Instalacao inicial"
      })
      .expect(201)
      .expect(({ body }) => {
        expect(body).toHaveLength(3);
        expect(body.map((point: MonitoringPoint) => point.label)).toEqual([
          "Armadilha 1",
          "Armadilha 2",
          "Armadilha 3"
        ]);
        expect(body[0]).toMatchObject({
          markerColor: "#123456",
          markerIconUrl: "https://example.test/trap.png",
          markerType: "icon"
        });
      });

    expect(
      await MonitoringPointHistory.count({
        where: { tenantId: user.tenantId, action: "installation" }
      })
    ).toBe(3);

    await request(app)
      .put(`/monitoring/points/${createdPoints.body[0].id}`)
      .set("Authorization", authorization)
      .send({
        sectorId: otherSector.id,
        historyAction: "sector_change",
        historyNotes: "Movido para camara fria"
      })
      .expect(200)
      .expect(({ body }) => {
        expect(body.sectorId).toBe(otherSector.id);
        expect(body.history).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ action: "sector_change" })
          ])
        );
      });

    await request(app)
      .post("/monitoring/floor-plans")
      .set("Authorization", authorization)
      .field("clientId", String(client.body.id))
      .field("addressId", String(address.id))
      .field("name", "Planta Cozinha")
      .field("notes", "Versao inicial")
      .attach("file", Buffer.from("fake-png"), {
        filename: "planta.png",
        contentType: "image/png"
      })
      .expect(201)
      .expect(({ body }) => {
        expect(body).toMatchObject({
          tenantId: user.tenantId,
          clientId: client.body.id,
          addressId: address.id,
          name: "Planta Cozinha",
          fileType: "image/png",
          originalFilename: "planta.png"
        });
        expect(body.fileUrl).toContain("/public/floor-plans/");
      });

    const floorPlan = await ClientFloorPlan.findOne({
      where: { tenantId: user.tenantId, name: "Planta Cozinha" }
    });
    expect(floorPlan).toBeTruthy();
    const floorPlanId = Number(floorPlan?.id);

    await request(app)
      .put(`/monitoring/points/${createdPoints.body[2].id}/position`)
      .set("Authorization", authorization)
      .send({
        floorPlanId,
        positionX: 32.5,
        positionY: 66.25,
        mapLabel: "PI-03",
        markerColor: "#2563eb",
        markerType: "color"
      })
      .expect(200)
      .expect(({ body }) => {
        expect(body).toMatchObject({
          floorPlanId,
          mapLabel: "PI-03",
          markerColor: "#123456",
          markerIconUrl: "https://example.test/trap.png",
          markerType: "icon",
          isPositioned: true
        });
        expect(Number(body.positionX)).toBeCloseTo(32.5);
        expect(Number(body.positionY)).toBeCloseTo(66.25);
      });

    expect(
      await MonitoringPointMapHistory.count({
        where: {
          tenantId: user.tenantId,
          monitoringPointId: createdPoints.body[2].id,
          floorPlanId
        }
      })
    ).toBe(1);

    await request(app)
      .delete(`/monitoring/points/${createdPoints.body[2].id}/position`)
      .set("Authorization", authorization)
      .send({ notes: "Reposicionar depois" })
      .expect(200)
      .expect(({ body }) => {
        expect(body.floorPlanId).toBeNull();
        expect(body.isPositioned).toBe(false);
      });

    expect(
      await MonitoringPointMapHistory.count({
        where: {
          tenantId: user.tenantId,
          monitoringPointId: createdPoints.body[2].id,
          floorPlanId
        }
      })
    ).toBe(2);

    await request(app)
      .get(`/monitoring/floor-plans?clientId=${client.body.id}`)
      .set("Authorization", authorization)
      .expect(200)
      .expect(({ body }) => {
        expect(body).toHaveLength(1);
      });

    await request(app)
      .get(`/monitoring/points?clientId=${client.body.id}`)
      .set("Authorization", authorization)
      .expect(200)
      .expect(({ body }) => {
        expect(body).toHaveLength(3);
      });

    await request(app)
      .delete(`/monitoring/points/${createdPoints.body[1].id}`)
      .set("Authorization", authorization)
      .send({ notes: "Ponto removido" })
      .expect(204);

    expect(
      await MonitoringPoint.count({
        where: { tenantId: user.tenantId },
        paranoid: false
      })
    ).toBe(3);
    expect(
      await MonitoringPoint.count({ where: { tenantId: user.tenantId } })
    ).toBe(2);
    expect(
      await MonitoringPointHistory.count({
        where: { tenantId: user.tenantId, action: "removal" }
      })
    ).toBe(1);

    await request(app)
      .delete(`/monitoring/trap-types/${trapType.body.id}`)
      .set("Authorization", authorization)
      .expect(409);

    expect(await TrapType.count({ where: { tenantId: user.tenantId } })).toBe(1);
  });
});
