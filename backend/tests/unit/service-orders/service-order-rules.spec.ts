import AppError from "../../../src/errors/AppError";
import {
  buildPublicServiceOrderDocumentHTML,
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
