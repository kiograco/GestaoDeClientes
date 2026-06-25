import brLocations from "../../../src/database/seeds/data/br-states-cities.json";
import { exportRows } from "../../../src/services/BaseRegisterServices/BaseRegisterExportService";

describe("Cadastros base", () => {
  it("possui seed oficial com estados e cidades vinculadas", () => {
    const states = brLocations.states as Array<{ ibgeCode: number }>;
    const cities = brLocations.cities as Array<{
      ibgeCode: number;
      stateIbgeCode: number;
      uf: string;
    }>;
    const stateCodes = new Set(states.map(state => state.ibgeCode));

    expect(states).toHaveLength(27);
    expect(cities).toHaveLength(5571);
    expect(cities.every(city => stateCodes.has(city.stateIbgeCode))).toBe(true);
    expect(cities.every(city => city.ibgeCode && city.uf)).toBe(true);
  });

  it("exporta linhas filtradas em CSV", async () => {
    const exported = await exportRows(
      [
        { id: 1, name: "Pix", status: "active" },
        { id: 2, name: "Boleto", status: "inactive" }
      ],
      [
        { key: "id", label: "ID" },
        { key: "name", label: "Nome" },
        { key: "status", label: "Status" }
      ],
      "csv",
      "formas-pagamento"
    );

    expect(exported.contentType).toContain("text/csv");
    expect(exported.fileName).toBe("formas-pagamento.csv");
    expect(exported.buffer.toString("utf8")).toContain('"Pix"');
    expect(exported.buffer.toString("utf8")).toContain('"Boleto"');
  });

  it("exporta XLSX e PDF para cadastros base", async () => {
    const rows = [{ id: 1, name: "Preventivo", status: "active" }];
    const columns = [
      { key: "id", label: "ID" },
      { key: "name", label: "Nome" }
    ];

    const xlsx = await exportRows(rows, columns, "xlsx", "tipos-atendimento");
    const pdf = await exportRows(rows, columns, "pdf", "tipos-atendimento");

    expect(xlsx.contentType).toContain("spreadsheetml");
    expect(xlsx.buffer.length).toBeGreaterThan(100);
    expect(pdf.contentType).toBe("application/pdf");
    expect(pdf.buffer.subarray(0, 4).toString()).toBe("%PDF");
  });
});
