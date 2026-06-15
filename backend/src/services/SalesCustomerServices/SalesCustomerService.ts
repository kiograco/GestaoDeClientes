import axios from "axios";
import { Op } from "sequelize";
import sequelize from "../../database";
import AppError from "../../errors/AppError";
import Client from "../../models/Client";
import ClientAddress from "../../models/ClientAddress";
import ClientContact from "../../models/ClientContact";

interface AddressData {
  id?: number;
  addressType?: string | null;
  linkedDocument?: string | null;
  zipCode?: string | null;
  street?: string | null;
  number?: string | null;
  complement?: string | null;
  district?: string | null;
  city?: string | null;
  state?: string | null;
  reference?: string | null;
  notes?: string | null;
}

interface ContactData {
  id?: number;
  addressId?: number | null;
  addressIndex?: number | null;
  name: string;
  role?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  email?: string | null;
  notes?: string | null;
}

export interface CustomerData {
  registrationType: string;
  legalName: string;
  tradeName?: string | null;
  document?: string | null;
  stateRegistration?: string | null;
  municipalRegistration?: string | null;
  activitySector?: string | null;
  status?: string;
  notes?: string | null;
  addresses?: AddressData[];
  contacts?: ContactData[];
}

const normalizeDigits = (value?: string | null): string =>
  value ? value.replace(/\D/g, "") : "";

const nullable = (value?: string | number | null): string | null => {
  if (value === null || value === undefined) return null;
  const text = String(value).trim();
  return text || null;
};

const clientInclude = [
  {
    model: ClientAddress,
    as: "addresses",
    required: false
  },
  {
    model: ClientContact,
    as: "contacts",
    required: false,
    include: [{ model: ClientAddress, as: "address", required: false }]
  }
];

const findClient = async (
  tenantId: string | number,
  clientId: string
): Promise<Client> => {
  const client = await Client.findOne({
    where: { id: clientId, tenantId },
    include: clientInclude,
    order: [
      [{ model: ClientAddress, as: "addresses" }, "id", "ASC"],
      [{ model: ClientContact, as: "contacts" }, "id", "ASC"]
    ]
  });
  if (!client) throw new AppError("ERR_CLIENT_NOT_FOUND", 404);
  return client;
};

const ensureUniqueDocument = async (
  tenantId: string | number,
  document?: string | null,
  clientId?: string
) => {
  const normalizedDocument = normalizeDigits(document);
  if (!normalizedDocument) return;
  const duplicate = await Client.findOne({
    where: {
      tenantId,
      document: normalizedDocument,
      ...(clientId ? { id: { [Op.ne]: clientId } } : {})
    }
  });
  if (duplicate) throw new AppError("ERR_CLIENT_DOCUMENT_ALREADY_EXISTS", 409);
};

const addressPayload = (
  tenantId: string | number,
  clientId: number,
  address: AddressData
) => ({
  tenantId,
  clientId,
  addressType: nullable(address.addressType) || "principal",
  linkedDocument: normalizeDigits(address.linkedDocument) || null,
  zipCode: normalizeDigits(address.zipCode) || null,
  street: nullable(address.street),
  number: nullable(address.number),
  complement: nullable(address.complement),
  district: nullable(address.district),
  city: nullable(address.city),
  state: nullable(address.state)?.toUpperCase() || null,
  reference: nullable(address.reference),
  notes: nullable(address.notes)
});

const contactPayload = (
  tenantId: string | number,
  clientId: number,
  contact: ContactData
) => ({
  tenantId,
  clientId,
  addressId: contact.addressId || null,
  name: contact.name.trim(),
  role: nullable(contact.role),
  phone: normalizeDigits(contact.phone) || null,
  whatsapp: normalizeDigits(contact.whatsapp) || null,
  email: nullable(contact.email)?.toLowerCase() || null,
  notes: nullable(contact.notes)
});

const syncAddresses = async (
  tenantId: string | number,
  clientId: number,
  addresses: AddressData[] = [],
  transaction: LegacyAny
): Promise<number[]> => {
  const existing = await ClientAddress.findAll({
    where: { tenantId, clientId },
    transaction
  });
  const existingIds = new Set(existing.map(address => address.id));
  const receivedIds = new Set<number>();

  const addressIds = await Promise.all(
    addresses.map(async address => {
      if (address.id && existingIds.has(address.id)) {
        receivedIds.add(address.id);
        await ClientAddress.update(
          addressPayload(tenantId, clientId, address),
          {
            where: { id: address.id, tenantId, clientId },
            transaction
          }
        );
        return address.id;
      }
      const created = await ClientAddress.create(
        addressPayload(tenantId, clientId, address),
        {
          transaction
        }
      );
      return created.id;
    })
  );

  const idsToDelete = existing
    .map(address => address.id)
    .filter(id => !receivedIds.has(id));
  if (idsToDelete.length) {
    await ClientAddress.destroy({
      where: { id: idsToDelete, tenantId, clientId },
      transaction
    });
  }
  return addressIds;
};

const syncContacts = async (
  tenantId: string | number,
  clientId: number,
  contacts: ContactData[] = [],
  syncedAddressIds: number[],
  transaction: LegacyAny
) => {
  const validAddressIds = new Set(
    (
      await ClientAddress.findAll({
        where: { tenantId, clientId },
        transaction
      })
    ).map(address => address.id)
  );
  const existing = await ClientContact.findAll({
    where: { tenantId, clientId },
    transaction
  });
  const existingIds = new Set(existing.map(contact => contact.id));
  const receivedIds = new Set<number>();

  await Promise.all(
    contacts.map(async contact => {
      const addressId =
        contact.addressId ||
        (contact.addressIndex !== null && contact.addressIndex !== undefined
          ? syncedAddressIds[contact.addressIndex]
          : null);
      const contactData = { ...contact, addressId };
      if (addressId && !validAddressIds.has(addressId)) {
        throw new AppError("ERR_CLIENT_CONTACT_ADDRESS_NOT_FOUND", 404);
      }
      if (contact.id && existingIds.has(contact.id)) {
        receivedIds.add(contact.id);
        await ClientContact.update(
          contactPayload(tenantId, clientId, contactData),
          {
            where: { id: contact.id, tenantId, clientId },
            transaction
          }
        );
        return;
      }
      await ClientContact.create(
        contactPayload(tenantId, clientId, contactData),
        {
          transaction
        }
      );
    })
  );

  const idsToDelete = existing
    .map(contact => contact.id)
    .filter(id => !receivedIds.has(id));
  if (idsToDelete.length) {
    await ClientContact.destroy({
      where: { id: idsToDelete, tenantId, clientId },
      transaction
    });
  }
};

const baseClientPayload = (tenantId: string | number, data: CustomerData) => ({
  tenantId,
  registrationType: data.registrationType,
  legalName: data.legalName.trim(),
  tradeName: nullable(data.tradeName),
  document: normalizeDigits(data.document) || null,
  stateRegistration: nullable(data.stateRegistration),
  municipalRegistration: nullable(data.municipalRegistration),
  activitySector: nullable(data.activitySector),
  status: data.status || "prospect",
  notes: nullable(data.notes)
});

export const listCustomers = async (
  tenantId: string | number,
  searchParam = ""
): Promise<Client[]> => {
  const search = searchParam.trim();
  const digits = normalizeDigits(search);
  const searchConditions: LegacyAny[] = [
    { legalName: { [Op.iLike]: `%${search}%` } },
    { tradeName: { [Op.iLike]: `%${search}%` } },
    { activitySector: { [Op.iLike]: `%${search}%` } }
  ];
  if (digits) searchConditions.push({ document: { [Op.like]: `%${digits}%` } });

  return Client.findAll({
    where: {
      tenantId,
      ...(search ? { [Op.or]: searchConditions } : {})
    },
    include: clientInclude,
    order: [["legalName", "ASC"]]
  });
};

export const showCustomer = async (
  tenantId: string | number,
  clientId: string
): Promise<Client> => findClient(tenantId, clientId);

export const createCustomer = async (
  tenantId: string | number,
  data: CustomerData
): Promise<Client> => {
  await ensureUniqueDocument(tenantId, data.document);
  const client = await sequelize.transaction(async transaction => {
    const created = await Client.create(baseClientPayload(tenantId, data), {
      transaction
    });
    const addressIds = await syncAddresses(
      tenantId,
      created.id,
      data.addresses,
      transaction
    );
    await syncContacts(
      tenantId,
      created.id,
      data.contacts,
      addressIds,
      transaction
    );
    return created;
  });
  return showCustomer(tenantId, String(client.id));
};

export const updateCustomer = async (
  tenantId: string | number,
  clientId: string,
  data: CustomerData
): Promise<Client> => {
  await ensureUniqueDocument(tenantId, data.document, clientId);
  const client = await Client.findOne({ where: { id: clientId, tenantId } });
  if (!client) throw new AppError("ERR_CLIENT_NOT_FOUND", 404);

  await sequelize.transaction(async transaction => {
    await client.update(baseClientPayload(tenantId, data), { transaction });
    const addressIds = await syncAddresses(
      tenantId,
      client.id,
      data.addresses,
      transaction
    );
    await syncContacts(
      tenantId,
      client.id,
      data.contacts,
      addressIds,
      transaction
    );
  });
  return showCustomer(tenantId, clientId);
};

export const deleteCustomer = async (
  tenantId: string | number,
  clientId: string
): Promise<void> => {
  const client = await Client.findOne({ where: { id: clientId, tenantId } });
  if (!client) throw new AppError("ERR_CLIENT_NOT_FOUND", 404);
  await sequelize.transaction(async transaction => {
    await ClientContact.destroy({
      where: { tenantId, clientId: client.id },
      transaction
    });
    await ClientAddress.destroy({
      where: { tenantId, clientId: client.id },
      transaction
    });
    await client.destroy({ transaction });
  });
};

export const findAddressByZipCode = async (
  zipCode: string
): Promise<LegacyAny> => {
  const normalizedZipCode = normalizeDigits(zipCode);
  if (!/^\d{8}$/.test(normalizedZipCode)) {
    throw new AppError("Informe um CEP valido com 8 digitos", 400);
  }
  try {
    const response = await axios.get(
      `https://viacep.com.br/ws/${normalizedZipCode}/json/`,
      { timeout: 5000 }
    );
    if (response.data.erro) throw new AppError("CEP nao encontrado", 404);
    return response.data;
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError("Nao foi possivel consultar o CEP", 502);
  }
};

export const findCompanyByCnpj = async (cnpj: string): Promise<LegacyAny> => {
  const normalizedCnpj = normalizeDigits(cnpj);
  if (!/^\d{14}$/.test(normalizedCnpj)) {
    throw new AppError("Informe um CNPJ valido com 14 digitos", 400);
  }
  try {
    const response = await axios.get(
      `https://brasilapi.com.br/api/cnpj/v1/${normalizedCnpj}`,
      { timeout: 8000 }
    );
    const { data } = response;
    return {
      legalName: data.razao_social || "",
      tradeName: data.nome_fantasia || "",
      zipCode: normalizeDigits(data.cep) || "",
      street: data.logradouro || "",
      number: data.numero || "",
      complement: data.complemento || "",
      district: data.bairro || "",
      city: data.municipio || "",
      state: data.uf || "",
      activitySector: data.cnae_fiscal_descricao || data.cnae_fiscal || ""
    };
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError("Nao foi possivel consultar o CNPJ", 502);
  }
};
