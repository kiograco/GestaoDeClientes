import { QueryInterface, QueryTypes } from "sequelize";

const DEMO_EMAIL = "demo@ncprogrammers.local";
const DEMO_PASSWORD_HASH =
  "$2a$08$/wEAiCcLkfGcnzxCQprgYeFryP7MCOIbjcpRlWTPY/EQ/ON.gI0qS";

const businessHours = [
  {
    day: 0,
    hr1: "08:00",
    hr2: "12:00",
    hr3: "14:00",
    hr4: "18:00",
    type: "C",
    label: "Domingo"
  },
  {
    day: 1,
    hr1: "08:00",
    hr2: "12:00",
    hr3: "14:00",
    hr4: "18:00",
    type: "O",
    label: "Segunda-Feira"
  },
  {
    day: 2,
    hr1: "08:00",
    hr2: "12:00",
    hr3: "14:00",
    hr4: "18:00",
    type: "O",
    label: "Terca-Feira"
  },
  {
    day: 3,
    hr1: "08:00",
    hr2: "12:00",
    hr3: "14:00",
    hr4: "18:00",
    type: "O",
    label: "Quarta-Feira"
  },
  {
    day: 4,
    hr1: "08:00",
    hr2: "12:00",
    hr3: "14:00",
    hr4: "18:00",
    type: "O",
    label: "Quinta-Feira"
  },
  {
    day: 5,
    hr1: "08:00",
    hr2: "12:00",
    hr3: "14:00",
    hr4: "18:00",
    type: "O",
    label: "Sexta-Feira"
  },
  {
    day: 6,
    hr1: "08:00",
    hr2: "12:00",
    hr3: "14:00",
    hr4: "18:00",
    type: "O",
    label: "Sabado"
  }
];

const settings = [
  ["userCreation", "disabled"],
  ["NotViewTicketsQueueUndefined", "disabled"],
  ["NotViewTicketsChatBot", "disabled"],
  ["DirectTicketsToWallets", "disabled"],
  ["NotViewAssignedTickets", "disabled"],
  ["botTicketActive", "3"],
  ["ignoreGroupMsg", "enabled"],
  ["rejectCalls", "disabled"],
  [
    "callRejectMessage",
    "As chamadas de voz e video estao desabilitadas para esse WhatsApp, favor enviar uma mensagem de texto."
  ]
];

const customers = [
  {
    name: "Condominio Jardim das Flores",
    number: "5511999001001",
    email: "sindico.jardim@example.test",
    companyName: "Condominio Jardim das Flores",
    document: "11222333000181",
    secondaryPhone: "5511988001001",
    salesStatus: "CUSTOMER",
    source: "Indicacao",
    notes: "Cliente demo para agenda de manutencao preventiva.",
    address: {
      street: "Rua das Acacias",
      number: "120",
      district: "Centro",
      city: "Sao Paulo",
      state: "SP",
      zipCode: "01001000",
      complement: "Portaria principal",
      reference: "Proximo a praca central"
    }
  },
  {
    name: "Restaurante Sabor Demo",
    number: "5511999001002",
    email: "operacao.sabor@example.test",
    companyName: "Restaurante Sabor Demo Ltda",
    document: "22333444000190",
    secondaryPhone: "5511988001002",
    salesStatus: "CUSTOMER",
    source: "Campanha local",
    notes: "Cliente demo com horario comercial restrito.",
    address: {
      street: "Avenida Brasil",
      number: "455",
      district: "Jardins",
      city: "Sao Paulo",
      state: "SP",
      zipCode: "01430000",
      complement: "Fundos",
      reference: "Entrada pela lateral"
    }
  },
  {
    name: "Casa Garcia",
    number: "5511999001003",
    email: "garcia@example.test",
    companyName: "Residencia Garcia",
    document: "12345678901",
    secondaryPhone: "5511988001003",
    salesStatus: "LEAD",
    source: "WhatsApp",
    notes: "Lead demo para apresentacao de OS residencial.",
    address: {
      street: "Rua das Palmeiras",
      number: "88",
      district: "Vila Mariana",
      city: "Sao Paulo",
      state: "SP",
      zipCode: "04012000",
      complement: "Casa 2",
      reference: "Portao azul"
    }
  },
  {
    name: "Empresa Alpha Demo",
    number: "5511999001004",
    email: "facilities.alpha@example.test",
    companyName: "Empresa Alpha Demo S/A",
    document: "33444555000109",
    secondaryPhone: "5511988001004",
    salesStatus: "CUSTOMER",
    source: "Contrato mensal",
    notes: "Cliente demo com atendimento recorrente.",
    address: {
      street: "Rua dos Pinheiros",
      number: "700",
      district: "Pinheiros",
      city: "Sao Paulo",
      state: "SP",
      zipCode: "05422000",
      complement: "10 andar",
      reference: "Recepcao corporativa"
    }
  }
];

const attendants = [
  {
    name: "Addilton Santos",
    email: "addilton.demo@example.test",
    phone: "5511977002001",
    specialty: "Instalacao",
    workingHours: { mondayToFriday: "08:00-18:00" }
  },
  {
    name: "Adriano Silva",
    email: "adriano.demo@example.test",
    phone: "5511977002002",
    specialty: "Manutencao preventiva",
    workingHours: { mondayToFriday: "08:00-18:00" }
  },
  {
    name: "Erivan Moraes",
    email: "erivan.demo@example.test",
    phone: "5511977002003",
    specialty: "Vistoria",
    workingHours: { mondayToFriday: "09:00-18:00" }
  },
  {
    name: "Jhefren Nascimento",
    email: "jhefren.demo@example.test",
    phone: "5511977002004",
    specialty: "Suporte tecnico",
    workingHours: { mondayToFriday: "08:00-17:00" }
  }
];

const orderTemplates = [
  {
    customerIndex: 0,
    attendantIndex: 0,
    title: "Instalacao controle de acesso",
    serviceType: "Instalacao",
    priority: "alta",
    status: "agendada",
    startHour: 8,
    endHour: 10,
    publicObservation: "Acessar pela portaria principal.",
    internalObservation: "Levar modulo reserva e testar abertura remota."
  },
  {
    customerIndex: 1,
    attendantIndex: 1,
    title: "Visita tecnica cozinha",
    serviceType: "Vistoria",
    priority: "media",
    status: "agendada",
    startHour: 8,
    endHour: 11,
    publicObservation: "Responsavel estara no local a partir das 08h.",
    internalObservation: "Validar ponto eletrico antes da substituicao."
  },
  {
    customerIndex: 2,
    attendantIndex: 2,
    title: "Servico residencial",
    serviceType: "Manutencao",
    priority: "baixa",
    status: "rascunho",
    startHour: 11,
    endHour: 12,
    publicObservation: "Confirmar presenca do cliente por telefone.",
    internalObservation: "Cliente pediu orcamento de extensao."
  },
  {
    customerIndex: 3,
    attendantIndex: 3,
    title: "Suporte contrato mensal",
    serviceType: "Suporte",
    priority: "urgente",
    status: "em_atendimento",
    startHour: 14,
    endHour: 16,
    publicObservation: "Atendimento no setor de facilities.",
    internalObservation: "SLA demo prioritario para apresentacao."
  },
  {
    customerIndex: 0,
    attendantIndex: 1,
    title: "Manutencao preventiva",
    serviceType: "Preventiva",
    priority: "media",
    status: "reagendada",
    startHour: 14,
    endHour: 15,
    publicObservation: "Reagendado para periodo da tarde.",
    internalObservation: "Conferir historico da OS anterior."
  },
  {
    customerIndex: 3,
    attendantIndex: 0,
    title: "Reserva para emergencia",
    serviceType: "Reserva",
    priority: "alta",
    status: "agendada",
    startHour: 17,
    endHour: 18,
    publicObservation: "Horario reservado para chamado emergencial.",
    internalObservation: "Usar como exemplo de reserva na agenda."
  }
];

const nextBusinessDate = (base = new Date()): Date => {
  const date = new Date(base);
  date.setDate(date.getDate() + 1);
  while (date.getDay() === 0 || date.getDay() === 6) {
    date.setDate(date.getDate() + 1);
  }
  date.setHours(0, 0, 0, 0);
  return date;
};

const scheduleDate = (baseDate: Date, hour: number): Date => {
  const date = new Date(baseDate);
  date.setHours(hour, 0, 0, 0);
  return date;
};

const findOne = async <T extends Record<string, unknown>>(
  queryInterface: QueryInterface,
  sql: string,
  replacements: Record<string, unknown>
): Promise<T | undefined> => {
  const rows = await queryInterface.sequelize.query<T>(sql, {
    replacements,
    type: QueryTypes.SELECT
  });
  return rows[0];
};

const insertReturningId = async (
  queryInterface: QueryInterface,
  sql: string,
  replacements: Record<string, unknown>
): Promise<number> => {
  const row = await findOne<{ id: number }>(queryInterface, sql, replacements);
  if (!row) throw new Error("Falha ao criar dados demo");
  return row.id;
};

module.exports = {
  up: async (queryInterface: QueryInterface) => {
    const now = new Date();
    const tenant =
      (await findOne<{ id: number }>(
        queryInterface,
        'SELECT id FROM "Tenants" WHERE name = :name LIMIT 1',
        { name: "Empresa Demo OS" }
      )) ||
      ({
        id: await insertReturningId(
          queryInterface,
          `
          INSERT INTO "Tenants"
            (status, name, "cpfCnpj", "accessExpiresAt", "maxUsers", "maxConnections", "businessType", "enabledModules", "registrationData", "businessHours", "messageBusinessHours", "createdAt", "updatedAt")
          VALUES
            ('active', :name, :cpfCnpj, :accessExpiresAt, 20, 10, 'delivery', CAST(:enabledModules AS jsonb), CAST(:registrationData AS jsonb), CAST(:businessHours AS jsonb), :messageBusinessHours, :now, :now)
          RETURNING id
          `,
          {
            name: "Empresa Demo OS",
            cpfCnpj: "44555666000110",
            accessExpiresAt: new Date("2099-12-31T23:59:59.000Z"),
            enabledModules: JSON.stringify({ delivery: true }),
            registrationData: JSON.stringify({ demo: true, source: "seed" }),
            businessHours: JSON.stringify(businessHours),
            messageBusinessHours:
              "Conta demo: retornaremos durante o horario comercial.",
            now
          }
        )
      } as { id: number });

    const user =
      (await findOne<{ id: number }>(
        queryInterface,
        'SELECT id FROM "Users" WHERE email = :email LIMIT 1',
        { email: DEMO_EMAIL }
      )) ||
      ({
        id: await insertReturningId(
          queryInterface,
          `
          INSERT INTO "Users"
            (name, email, "passwordHash", profile, status, "tokenVersion", "tenantId", "isOnline", configs, "createdAt", "updatedAt")
          VALUES
            ('Administrador Demo OS', :email, :passwordHash, 'admin', 'offline', 0, :tenantId, false, CAST(:configs AS jsonb), :now, :now)
          RETURNING id
          `,
          {
            email: DEMO_EMAIL,
            passwordHash: DEMO_PASSWORD_HASH,
            tenantId: tenant.id,
            configs: JSON.stringify({
              filtrosAtendimento: {
                searchParam: "",
                pageNumber: 1,
                status: ["open", "pending"],
                showAll: true,
                queuesIds: []
              },
              isDark: false
            }),
            now
          }
        )
      } as { id: number });

    await queryInterface.sequelize.query(
      'UPDATE "Tenants" SET "ownerId" = :ownerId, "updatedAt" = :now WHERE id = :tenantId',
      { replacements: { ownerId: user.id, tenantId: tenant.id, now } }
    );

    await Promise.all(
      settings.map(([key, value]) =>
        queryInterface.sequelize.query(
          `
          INSERT INTO "Settings" ("key", value, "tenantId", "createdAt", "updatedAt")
          SELECT :key, :value, :tenantId, :now, :now
          WHERE NOT EXISTS (
            SELECT 1 FROM "Settings" WHERE "key" = :key AND "tenantId" = :tenantId
          )
          `,
          { replacements: { key, value, tenantId: tenant.id, now } }
        )
      )
    );

    await queryInterface.sequelize.query(
      `
      INSERT INTO "Whatsapps"
        ("session", qrcode, status, battery, plugged, "createdAt", "updatedAt", name, "isDefault", retries, "tenantId", phone, number, "isDeleted", "tokenTelegram", type, "instagramUser", "instagramKey", "tokenHook", "tokenAPI", "wabaBSP", "isActive", "fbPageId", "fbObject")
      SELECT '', '', 'DISCONNECTED', '100', false, :now, :now, 'WhatsApp Demo OS', true, 0, :tenantId, '{}'::jsonb, '5511999000000', false, NULL, 'whatsapp', NULL, NULL, '', NULL, NULL, true, NULL, NULL
      WHERE NOT EXISTS (
        SELECT 1 FROM "Whatsapps" WHERE name = 'WhatsApp Demo OS' AND "tenantId" = :tenantId
      )
      `,
      { replacements: { tenantId: tenant.id, now } }
    );

    const contactIds = await customers.reduce<Promise<number[]>>(
      async (previousIds, customer) => {
        const ids = await previousIds;
        const existingContact = await findOne<{ id: number }>(
          queryInterface,
          'SELECT id FROM "Contacts" WHERE "tenantId" = :tenantId AND number = :number LIMIT 1',
          { tenantId: tenant.id, number: customer.number }
        );
        const contactId =
          existingContact?.id ||
          (await insertReturningId(
            queryInterface,
            `
            INSERT INTO "Contacts"
              (name, number, email, "tenantId", "profilePicUrl", pushname, "isUser", "isWAContact", "isGroup", "createdAt", "updatedAt")
            VALUES
              (:name, :number, :email, :tenantId, '', :name, false, true, false, :now, :now)
            RETURNING id
            `,
            { ...customer, tenantId: tenant.id, now }
          ));

        await queryInterface.sequelize.query(
          `
          INSERT INTO "CustomerProfiles"
            ("tenantId", "contactId", document, "secondaryPhone", "companyName", "birthDate", "salesStatus", source, notes, "createdAt", "updatedAt")
          SELECT :tenantId, :contactId, :document, :secondaryPhone, :companyName, NULL, :salesStatus, :source, :notes, :now, :now
          WHERE NOT EXISTS (
            SELECT 1 FROM "CustomerProfiles" WHERE "tenantId" = :tenantId AND "contactId" = :contactId
          )
          `,
          { replacements: { ...customer, tenantId: tenant.id, contactId, now } }
        );

        await queryInterface.sequelize.query(
          `
          INSERT INTO "CustomerAddresses"
            ("tenantId", "contactId", label, street, number, district, city, state, "zipCode", complement, reference, "isDefault", "createdAt", "updatedAt")
          SELECT :tenantId, :contactId, 'Principal', :street, :number, :district, :city, :state, :zipCode, :complement, :reference, true, :now, :now
          WHERE NOT EXISTS (
            SELECT 1 FROM "CustomerAddresses" WHERE "tenantId" = :tenantId AND "contactId" = :contactId AND label = 'Principal'
          )
          `,
          {
            replacements: {
              ...customer.address,
              tenantId: tenant.id,
              contactId,
              now
            }
          }
        );

        return [...ids, contactId];
      },
      Promise.resolve([])
    );

    const attendantIds = await attendants.reduce<Promise<number[]>>(
      async (previousIds, attendant) => {
        const ids = await previousIds;
        const existingAttendant = await findOne<{ id: number }>(
          queryInterface,
          'SELECT id FROM "ServiceAttendants" WHERE "tenantId" = :tenantId AND email = :email LIMIT 1',
          { tenantId: tenant.id, email: attendant.email }
        );
        const attendantId =
          existingAttendant?.id ||
          (await insertReturningId(
            queryInterface,
            `
            INSERT INTO "ServiceAttendants"
              ("tenantId", name, email, phone, specialty, active, "workingHours", "createdAt", "updatedAt")
            VALUES
              (:tenantId, :name, :email, :phone, :specialty, true, CAST(:workingHours AS jsonb), :now, :now)
            RETURNING id
            `,
            {
              ...attendant,
              tenantId: tenant.id,
              workingHours: JSON.stringify(attendant.workingHours),
              now
            }
          ));
        return [...ids, attendantId];
      },
      Promise.resolve([])
    );

    const baseDate = nextBusinessDate(now);
    await Promise.all(
      orderTemplates.map(order => {
        const scheduledStart = scheduleDate(baseDate, order.startHour);
        const scheduledEnd = scheduleDate(baseDate, order.endHour);
        return queryInterface.sequelize.query(
          `
          INSERT INTO "ServiceOrders"
            ("tenantId", "contactId", "attendantId", "createdByUserId", title, description, "serviceType", priority, status, "scheduledStart", "scheduledEnd", address, "addressComplement", city, state, "zipCode", "publicObservation", "internalObservation", "attachmentUrls", "createdAt", "updatedAt")
          SELECT :tenantId, :contactId, :attendantId, :createdByUserId, :title, :description, :serviceType, :priority, :status, :scheduledStart, :scheduledEnd, :address, :addressComplement, :city, :state, :zipCode, :publicObservation, :internalObservation, '[]'::jsonb, :now, :now
          WHERE NOT EXISTS (
            SELECT 1 FROM "ServiceOrders"
            WHERE "tenantId" = :tenantId AND title = :title AND "scheduledStart" = :scheduledStart
          )
          `,
          {
            replacements: {
              tenantId: tenant.id,
              contactId: contactIds[order.customerIndex],
              attendantId: attendantIds[order.attendantIndex],
              createdByUserId: user.id,
              title: order.title,
              description: `${order.title} gerada automaticamente para demonstracao e testes.`,
              serviceType: order.serviceType,
              priority: order.priority,
              status: order.status,
              scheduledStart,
              scheduledEnd,
              address: customers[order.customerIndex].address.street,
              addressComplement:
                customers[order.customerIndex].address.complement,
              city: customers[order.customerIndex].address.city,
              state: customers[order.customerIndex].address.state,
              zipCode: customers[order.customerIndex].address.zipCode,
              publicObservation: order.publicObservation,
              internalObservation: order.internalObservation,
              now
            }
          }
        );
      })
    );
  },

  down: async (queryInterface: QueryInterface) => {
    const tenant = await findOne<{ id: number }>(
      queryInterface,
      'SELECT id FROM "Tenants" WHERE name = :name LIMIT 1',
      { name: "Empresa Demo OS" }
    );
    if (!tenant) return;

    await queryInterface.sequelize.query(
      `
      DELETE FROM "ServiceOrderLogs"
      WHERE "serviceOrderId" IN (
        SELECT id FROM "ServiceOrders" WHERE "tenantId" = :tenantId
      )
      `,
      { replacements: { tenantId: tenant.id } }
    );
    await queryInterface.bulkDelete(
      "ServiceOrders",
      { tenantId: tenant.id },
      {}
    );
    await queryInterface.bulkDelete(
      "ServiceAttendants",
      { tenantId: tenant.id },
      {}
    );
    await queryInterface.bulkDelete(
      "CustomerAddresses",
      { tenantId: tenant.id },
      {}
    );
    await queryInterface.bulkDelete(
      "CustomerProfiles",
      { tenantId: tenant.id },
      {}
    );
    await queryInterface.bulkDelete("Contacts", { tenantId: tenant.id }, {});
    await queryInterface.bulkDelete("Whatsapps", { tenantId: tenant.id }, {});
    await queryInterface.bulkDelete("Settings", { tenantId: tenant.id }, {});
    await queryInterface.bulkDelete("Users", { email: DEMO_EMAIL }, {});
    await queryInterface.bulkDelete("Tenants", { id: tenant.id }, {});
  }
};
