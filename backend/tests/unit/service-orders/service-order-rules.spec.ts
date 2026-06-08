import AppError from "../../../src/errors/AppError";
import {
  buildPublicServiceOrderDocumentHTML,
  expandServiceOrderOccurrences,
  validateServiceOrderSchedule
} from "../../../src/services/ServiceOrderServices/ServiceOrderService";

jest.mock("../../../src/database", () => ({
  __esModule: true,
  default: {
    transaction: jest.fn(),
    models: []
  }
}));

describe("ServiceOrderService regras", () => {
  it("rejeita horario final menor ou igual ao inicial", () => {
    expect(() =>
      validateServiceOrderSchedule({
        contactId: 1,
        title: "Instalacao",
        serviceType: "instalacao",
        status: "agendada",
        scheduledStart: "2026-06-05T10:00:00.000Z",
        scheduledEnd: "2026-06-05T10:00:00.000Z"
      })
    ).toThrow(AppError);
  });

  it("exige horario para ordens fora de rascunho", () => {
    expect(() =>
      validateServiceOrderSchedule({
        contactId: 1,
        title: "Instalacao",
        serviceType: "instalacao",
        status: "agendada"
      })
    ).toThrow(AppError);
  });

  it("aceita ordem avulsa sem campos de recorrencia", () => {
    expect(() =>
      validateServiceOrderSchedule({
        contactId: 1,
        title: "Instalacao",
        serviceType: "instalacao",
        status: "agendada",
        scheduledStart: "2026-06-05T10:00:00.000Z",
        scheduledEnd: "2026-06-05T11:00:00.000Z",
        recurrenceType: "single",
        recurrenceActive: false
      })
    ).not.toThrow();
  });

  it("exige dia fixo do mes para recorrencia mensal", () => {
    expect(() =>
      validateServiceOrderSchedule({
        contactId: 1,
        title: "Instalacao",
        serviceType: "instalacao",
        status: "agendada",
        scheduledStart: "2026-06-05T10:00:00.000Z",
        scheduledEnd: "2026-06-05T11:00:00.000Z",
        recurrenceType: "monthly_fixed_day",
        recurrenceActive: true
      })
    ).toThrow(AppError);
  });

  it("exige intervalo em dias para recorrencia editavel", () => {
    expect(() =>
      validateServiceOrderSchedule({
        contactId: 1,
        title: "Instalacao",
        serviceType: "instalacao",
        status: "agendada",
        scheduledStart: "2026-06-05T10:00:00.000Z",
        scheduledEnd: "2026-06-05T11:00:00.000Z",
        recurrenceType: "custom_interval",
        recurrenceActive: true
      })
    ).toThrow(AppError);
  });

  it("aceita recorrencia editavel a cada 30 dias", () => {
    expect(() =>
      validateServiceOrderSchedule({
        contactId: 1,
        title: "Instalacao",
        serviceType: "instalacao",
        status: "agendada",
        scheduledStart: "2026-06-05T10:00:00.000Z",
        scheduledEnd: "2026-06-05T11:00:00.000Z",
        recurrenceType: "custom_interval",
        recurrenceActive: true,
        recurrenceIntervalDays: 30
      })
    ).not.toThrow();
  });

  it("expande recorrencia por intervalo nos dias da agenda", () => {
    const occurrences = expandServiceOrderOccurrences(
      [
        {
          id: 10,
          tenantId: 1,
          title: "Manutencao mensal",
          recurrenceActive: true,
          recurrenceType: "custom_interval",
          recurrenceIntervalDays: 30,
          scheduledStart: "2026-06-01T09:00:00.000Z",
          scheduledEnd: "2026-06-01T10:00:00.000Z"
        }
      ],
      new Date("2026-07-01T00:00:00.000Z"),
      new Date("2026-07-02T00:00:00.000Z")
    );

    expect(occurrences).toHaveLength(1);
    expect(occurrences[0]).toMatchObject({
      id: 10,
      originalServiceOrderId: 10,
      recurringOccurrence: true,
      scheduledStart: "2026-07-01T09:00:00.000Z",
      scheduledEnd: "2026-07-01T10:00:00.000Z"
    });
  });

  it("expande recorrencia mensal no dia fixo configurado", () => {
    const occurrences = expandServiceOrderOccurrences(
      [
        {
          id: 11,
          tenantId: 1,
          title: "Visita mensal",
          recurrenceActive: true,
          recurrenceType: "monthly_fixed_day",
          recurrenceDayOfMonth: 15,
          scheduledStart: "2026-06-10T14:30:00.000Z",
          scheduledEnd: "2026-06-10T15:30:00.000Z"
        }
      ],
      new Date("2026-08-15T00:00:00.000Z"),
      new Date("2026-08-16T00:00:00.000Z")
    );

    expect(occurrences).toHaveLength(1);
    expect(occurrences[0]).toMatchObject({
      id: 11,
      originalServiceOrderId: 11,
      recurringOccurrence: true,
      scheduledStart: "2026-08-15T14:30:00.000Z",
      scheduledEnd: "2026-08-15T15:30:00.000Z"
    });
  });

  it("nao inclui observacao interna no documento publico", () => {
    const html = buildPublicServiceOrderDocumentHTML({
      tenantName: "Empresa Teste",
      serviceOrder: {
        id: 10,
        contact: { name: "Cliente Teste" },
        address: "Rua A",
        addressComplement: "Sala 2",
        city: "Sao Paulo",
        state: "SP",
        zipCode: "01001000",
        scheduledStart: new Date("2026-06-05T10:00:00.000Z"),
        scheduledEnd: new Date("2026-06-05T11:00:00.000Z"),
        serviceType: "Instalacao",
        description: "Servico tecnico",
        publicObservation: "Abrir portao",
        internalObservation: "Nao mostrar ao cliente"
      } as LegacyAny
    });

    expect(html).toContain("Abrir portao");
    expect(html).not.toContain("Nao mostrar ao cliente");
    expect(html).not.toContain("internalObservation");
  });
});
