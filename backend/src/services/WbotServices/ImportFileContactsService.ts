/* eslint-disable no-await-in-loop */
import { has } from "lodash";
import ExcelJS from "exceljs";
import Contact from "../../models/Contact";
// import CheckContactNumber from "../WbotServices/CheckNumber";

export async function ImportFileContactsService(
  tenantId: number,
  file: Express.Multer.File | undefined,
  tags: string[],
  wallets: string[]
): Promise<Contact[]> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(file?.path as string);
  const worksheet = workbook.worksheets[0];

  const headers: Record<number, string> = {};
  const rows: Record<string, string>[] = [];

  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) {
      row.eachCell((cell, colNumber) => {
        headers[colNumber] = String(cell.value ?? "");
      });
    } else {
      const rowData: Record<string, string> = {};
      row.eachCell((cell, colNumber) => {
        rowData[headers[colNumber]] = String(cell.value ?? "");
      });
      rows.push(rowData);
    }
  });
  const contacts: LegacyAny = [];

  rows.forEach(row => {
    let name = "";
    let number = "";
    let email = "";

    if (has(row, "nome") || has(row, "Nome")) {
      name = row.nome || row.Nome;
    }

    if (
      has(row, "numero") ||
      has(row, "número") ||
      has(row, "Numero") ||
      has(row, "Número")
    ) {
      number = row.numero || row["número"] || row.Numero || row["Número"];
      number = `${number}`.replace(/\D/g, "");
    }

    if (
      has(row, "email") ||
      has(row, "e-mail") ||
      has(row, "Email") ||
      has(row, "E-mail")
    ) {
      email = row.email || row["e-mail"] || row.Email || row["E-mail"];
    }

    name = name || number;

    if (name && number && number.length >= 10) {
      contacts.push({ name, number, email, tenantId });
    }
  });

  const contactList: Contact[] = [];

  // eslint-disable-next-line no-restricted-syntax
  for (const contact of contacts) {
    try {
      // eslint-disable-next-line no-await-in-loop
      // const waNumber = await CheckIsValidContact(
      //   `${contact.number}`,
      //   `${contact.tenantId}`
      // );

      // eslint-disable-next-line no-await-in-loop
      const [newContact, created] = await Contact.findOrCreate({
        where: {
          number: contact.number, // `${waNumber.user}`,
          tenantId: contact.tenantId
        },
        defaults: contact
      });

      const setContact: LegacyAny = newContact;
      if (created) {
        contactList.push(newContact);
      }

      if (tags?.length) {
        await setContact.setTags(tags, { through: { tenantId } });
      }

      if (wallets?.length) {
        await setContact.setWallets(wallets, { through: { tenantId } });
      }
    } catch (error) {
      console.error(`Número não é uma conta válida ${contact.number}`);
    }
  }

  return contactList;
}
