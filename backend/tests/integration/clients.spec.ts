import axios from "axios";
import request from "supertest";
import AuditLog from "../../src/models/AuditLog";
import Client from "../../src/models/Client";
import ClientAddress from "../../src/models/ClientAddress";
import ClientContact from "../../src/models/ClientContact";
import { bearerTokenFor } from "../helpers/auth";
import { makeTestApp } from "../helpers/app";
import { createAdminUser } from "../factories";

const clientPayload = (document = "11222333000181") => ({
  registrationType: "legal_entity",
  legalName: "Controle Ambiental Alfa Ltda",
  tradeName: "Alfa Pragas",
  document,
  stateRegistration: "123456789",
  municipalRegistration: "987654321",
  activitySector: "Controle de pragas",
  status: "active",
  notes: "Cliente com atendimento recorrente",
  addresses: [
    {
      addressType: "Matriz",
      linkedDocument: document,
      zipCode: "01001000",
      street: "Praca da Se",
      number: "100",
      complement: "Sala 12",
      district: "Se",
      city: "Sao Paulo",
      state: "SP",
      reference: "Proximo ao metro",
      notes: "Entrada pela portaria comercial"
    },
    {
      addressType: "Filial",
      linkedDocument: document,
      zipCode: "20040002",
      street: "Rua da Quitanda",
      number: "50",
      district: "Centro",
      city: "Rio de Janeiro",
      state: "RJ"
    }
  ],
  contacts: [
    {
      name: "Marina Silva",
      role: "Sindica",
      phone: "11999990000",
      whatsapp: "11988880000",
      email: "marina@example.test",
      addressIndex: 0,
      notes: "Contato principal"
    }
  ]
});

describe("clients API", () => {
  it("gerencia clientes com enderecos, contatos, auditoria e isolamento por tenant", async () => {
    const app = await makeTestApp();
    const user = await createAdminUser();
    const otherUser = await createAdminUser();
    const authorization = bearerTokenFor(user);

    const created = await request(app)
      .post("/clients")
      .set("Authorization", authorization)
      .send(clientPayload())
      .expect(201)
      .expect(({ body }) => {
        expect(body).toMatchObject({
          tenantId: user.tenantId,
          registrationType: "legal_entity",
          legalName: "Controle Ambiental Alfa Ltda",
          tradeName: "Alfa Pragas",
          document: "11222333000181",
          status: "active"
        });
        expect(body.addresses).toHaveLength(2);
        expect(body.contacts).toHaveLength(1);
        expect(body.contacts[0]).toMatchObject({
          name: "Marina Silva",
          email: "marina@example.test"
        });
        expect(body.contacts[0].addressId).toBe(body.addresses[0].id);
      });

    await request(app)
      .post("/clients")
      .set("Authorization", authorization)
      .send(clientPayload())
      .expect(409);

    await request(app)
      .post("/clients")
      .set("Authorization", bearerTokenFor(otherUser))
      .send(clientPayload())
      .expect(201);

    await request(app)
      .get(`/clients/${created.body.id}`)
      .set("Authorization", bearerTokenFor(otherUser))
      .expect(404);

    await request(app)
      .get("/clients?searchParam=Alfa")
      .set("Authorization", authorization)
      .expect(200)
      .expect(({ body }) => {
        expect(body).toHaveLength(1);
        expect(body[0].id).toBe(created.body.id);
      });

    await request(app)
      .put(`/clients/${created.body.id}`)
      .set("Authorization", authorization)
      .send({
        ...clientPayload(),
        legalName: "Controle Ambiental Alfa Atualizada",
        status: "inactive",
        addresses: [
          {
            ...created.body.addresses[0],
            city: "Santo Andre"
          }
        ],
        contacts: [
          {
            ...created.body.contacts[0],
            addressId: created.body.addresses[0].id,
            role: "Responsavel tecnico"
          },
          {
            name: "Carlos Souza",
            phone: "1133334444",
            addressId: created.body.addresses[0].id
          }
        ]
      })
      .expect(200)
      .expect(({ body }) => {
        expect(body.legalName).toBe("Controle Ambiental Alfa Atualizada");
        expect(body.status).toBe("inactive");
        expect(body.addresses).toHaveLength(1);
        expect(body.addresses[0].city).toBe("Santo Andre");
        expect(body.contacts).toHaveLength(2);
      });

    await request(app)
      .delete(`/clients/${created.body.id}`)
      .set("Authorization", authorization)
      .expect(204);

    await request(app)
      .get(`/clients/${created.body.id}`)
      .set("Authorization", authorization)
      .expect(404);

    expect(await Client.count({ where: { tenantId: user.tenantId } })).toBe(0);
    expect(
      await Client.count({
        where: { tenantId: user.tenantId },
        paranoid: false
      })
    ).toBe(1);
    expect(
      await ClientAddress.count({
        where: { tenantId: user.tenantId },
        paranoid: false
      })
    ).toBeGreaterThan(0);
    expect(
      await ClientContact.count({
        where: { tenantId: user.tenantId },
        paranoid: false
      })
    ).toBeGreaterThan(0);
    expect(
      await AuditLog.count({
        where: {
          tenantId: user.tenantId,
          resource: "client"
        }
      })
    ).toBe(3);
  });

  it("consulta CNPJ em API publica sem depender de rede real", async () => {
    const app = await makeTestApp();
    const user = await createAdminUser();
    jest.spyOn(axios, "get").mockResolvedValueOnce({
      data: {
        razao_social: "Empresa CNPJ Teste Ltda",
        nome_fantasia: "CNPJ Teste",
        cep: "01001000",
        logradouro: "Praca da Se",
        numero: "10",
        complemento: "Conjunto 1",
        bairro: "Se",
        municipio: "Sao Paulo",
        uf: "SP",
        cnae_fiscal_descricao: "Controle de pragas urbanas"
      }
    });

    await request(app)
      .get("/clients/cnpj/11222333000181")
      .set("Authorization", bearerTokenFor(user))
      .expect(200)
      .expect(({ body }) => {
        expect(body).toMatchObject({
          legalName: "Empresa CNPJ Teste Ltda",
          tradeName: "CNPJ Teste",
          zipCode: "01001000",
          street: "Praca da Se",
          number: "10",
          district: "Se",
          city: "Sao Paulo",
          state: "SP",
          activitySector: "Controle de pragas urbanas"
        });
      });
  });
});
