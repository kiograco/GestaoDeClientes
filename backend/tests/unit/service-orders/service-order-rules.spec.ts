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
