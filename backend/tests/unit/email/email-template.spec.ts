import { renderEmailTemplate } from "../../../src/services/EmailServices/EmailTemplateService";

describe("EmailTemplateService", () => {
  it("renderiza a OS e escapa dados dinamicos", async () => {
    const html = await renderEmailTemplate("order-service", {
      company_name: "Empresa Teste",
      client_name: '<script>alert("xss")</script>',
      order_number: 123,
      service_date: "19/06/2026",
      technician_name: "Tecnico Teste",
      address: "Rua de Teste, 100",
      services: "Inspecao",
      footer_signature: "Atendimento"
    });

    expect(html).toContain("Ordem de Servico #123");
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
  });

  it("recusa nome de template fora da lista permitida", async () => {
    await expect(
      renderEmailTemplate("../../segredo" as never, {})
    ).rejects.toThrow("Template invalido");
  });
});
