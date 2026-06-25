import PDFDocument from "pdfkit";
import XLSX from "xlsx";

export type ExportFormat = "csv" | "xlsx" | "pdf";

export interface ExportColumn {
  key: string;
  label: string;
}

const normalizeValue = (value: unknown): string => {
  if (value === null || value === undefined) return "";
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
};

const csvEscape = (value: unknown): string =>
  `"${normalizeValue(value).replace(/"/g, '""')}"`;

const objectPathValue = (row: Record<string, unknown>, path: string): unknown =>
  path.split(".").reduce((acc: unknown, key: string) => {
    if (!acc || typeof acc !== "object") return null;
    return (acc as Record<string, unknown>)[key];
  }, row);

export const exportRows = async (
  rows: Record<string, unknown>[],
  columns: ExportColumn[],
  format: ExportFormat,
  title: string
): Promise<{ contentType: string; fileName: string; buffer: Buffer }> => {
  const normalizedRows = rows.map(row =>
    columns.reduce((acc, column) => {
      acc[column.label] = normalizeValue(objectPathValue(row, column.key));
      return acc;
    }, {} as Record<string, string>)
  );

  if (format === "xlsx") {
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.json_to_sheet(normalizedRows),
      title.slice(0, 31)
    );
    return {
      contentType:
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      fileName: `${title}.xlsx`,
      buffer: XLSX.write(workbook, { type: "buffer", bookType: "xlsx" })
    };
  }

  if (format === "pdf") {
    const document = new PDFDocument({ margin: 36, size: "A4" });
    const chunks: Buffer[] = [];
    document.on("data", chunk => chunks.push(chunk as Buffer));
    const done = new Promise<Buffer>(resolve => {
      document.on("end", () => resolve(Buffer.concat(chunks)));
    });
    document.fontSize(14).text(title, { underline: true });
    document.moveDown();
    normalizedRows.forEach((row, index) => {
      document.fontSize(9).text(`${index + 1}.`);
      columns.forEach(column => {
        document.text(`${column.label}: ${row[column.label] || "-"}`);
      });
      document.moveDown(0.5);
    });
    document.end();
    return {
      contentType: "application/pdf",
      fileName: `${title}.pdf`,
      buffer: await done
    };
  }

  const csv = [
    columns.map(column => csvEscape(column.label)).join(","),
    ...rows.map(row =>
      columns
        .map(column => csvEscape(objectPathValue(row, column.key)))
        .join(",")
    )
  ].join("\n");

  return {
    contentType: "text/csv; charset=utf-8",
    fileName: `${title}.csv`,
    buffer: Buffer.from(`\uFEFF${csv}`, "utf8")
  };
};
