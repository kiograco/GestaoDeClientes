import axios from "axios";
import { Op } from "sequelize";
import sequelize from "../../database";
import AppError from "../../errors/AppError";
import Client from "../../models/Client";
import ClientArea from "../../models/ClientArea";
import ClientAreaService from "../../models/ClientAreaService";
import ClientAddress from "../../models/ClientAddress";
import ClientContact from "../../models/ClientContact";
import ClientSector from "../../models/ClientSector";

interface SectorData {
  id?: number;
  name: string;
  description?: string | null;
  notes?: string | null;
}

interface AreaData {
  id?: number;
  addressId?: number | null;
  addressIndex?: number | null;
  name: string;
  areaType?: string | null;
  description?: string | null;
  notes?: string | null;
  services?: string[];
  sectors?: SectorData[];
}

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
  areas?: AreaData[];
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
    required: false,
    include: [
      {
        model: ClientArea,
        as: "areas",
        required: false,
        include: [
          { model: ClientAreaService, as: "services", required: false },
          { model: ClientSector, as: "sectors", required: false }
        ]
      }
    ]
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
      [
        { model: ClientAddress, as: "addresses" },
        { model: ClientArea, as: "areas" },
        "id",
        "ASC"
      ],
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

const areaPayload = (
  tenantId: string | number,
  clientId: number,
  addressId: number,
  area: AreaData
) => ({
  tenantId,
  clientId,
  addressId,
  name: area.name.trim(),
  areaType: nullable(area.areaType),
  description: nullable(area.description),
  notes: nullable(area.notes)
});

const sectorPayload = (
  tenantId: string | number,
  areaId: number,
  sector: SectorData
) => ({
  tenantId,
  areaId,
  name: sector.name.trim(),
  description: nullable(sector.description),
  notes: nullable(sector.notes)
});

const areaInclude = [
  { model: ClientAddress, as: "address", required: false },
  { model: ClientAreaService, as: "services", required: false },
  { model: ClientSector, as: "sectors", required: false }
];

async function deleteAreaChildren(
  tenantId: string | number,
  areaIds: number[],
  transaction: LegacyAny
) {
  if (!areaIds.length) return;
  await ClientSector.destroy({
    where: { tenantId, areaId: areaIds },
    transaction
  });
  await ClientAreaService.destroy({
    where: { tenantId, areaId: areaIds },
    transaction
  });
}

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
    const areasToDelete = await ClientArea.findAll({
      where: { tenantId, clientId, addressId: idsToDelete },
      attributes: ["id"],
      transaction
    });
    await deleteAreaChildren(
      tenantId,
      areasToDelete.map(area => area.id),
      transaction
    );
    await ClientArea.destroy({
      where: { tenantId, clientId, addressId: idsToDelete },
      transaction
    });
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

const syncAreaServices = async (
  tenantId: string | number,
  areaId: number,
  services: string[] = [],
  transaction: LegacyAny
) => {
  await ClientAreaService.destroy({
    where: { tenantId, areaId },
    transaction
  });
  const normalizedServices = Array.from(
    new Set(services.map(service => nullable(service)).filter(Boolean))
  ) as string[];
  if (!normalizedServices.length) return;
  await ClientAreaService.bulkCreate(
    normalizedServices.map(serviceName => ({
      tenantId,
      areaId,
      serviceName
    })),
    { transaction }
  );
};

const syncSectors = async (
  tenantId: string | number,
  areaId: number,
  sectors: SectorData[] = [],
  transaction: LegacyAny
) => {
  const existing = await ClientSector.findAll({
    where: { tenantId, areaId },
    transaction
  });
  const existingIds = new Set(existing.map(sector => sector.id));
  const receivedIds = new Set<number>();

  await Promise.all(
    sectors.map(async sector => {
      if (sector.id && existingIds.has(sector.id)) {
        receivedIds.add(sector.id);
        await ClientSector.update(sectorPayload(tenantId, areaId, sector), {
          where: { id: sector.id, tenantId, areaId },
          transaction
        });
        return;
      }
      await ClientSector.create(sectorPayload(tenantId, areaId, sector), {
        transaction
      });
    })
  );

  const idsToDelete = existing
    .map(sector => sector.id)
    .filter(id => !receivedIds.has(id));
  if (idsToDelete.length) {
    await ClientSector.destroy({
      where: { id: idsToDelete, tenantId, areaId },
      transaction
    });
  }
};

const syncAreas = async (
  tenantId: string | number,
  clientId: number,
  areas: AreaData[] = [],
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
  const existing = await ClientArea.findAll({
    where: { tenantId, clientId },
    transaction
  });
  const existingIds = new Set(existing.map(area => area.id));
  const receivedIds = new Set<number>();

  await Promise.all(
    areas.map(async area => {
      const addressId =
        area.addressId ||
        (area.addressIndex !== null && area.addressIndex !== undefined
          ? syncedAddressIds[area.addressIndex]
          : null);
      if (!addressId || !validAddressIds.has(addressId)) {
        throw new AppError("ERR_CLIENT_AREA_ADDRESS_NOT_FOUND", 404);
      }
      if (area.id && existingIds.has(area.id)) {
        receivedIds.add(area.id);
        await ClientArea.update(
          areaPayload(tenantId, clientId, addressId, area),
          {
            where: { id: area.id, tenantId, clientId },
            transaction
          }
        );
        await syncAreaServices(tenantId, area.id, area.services, transaction);
        await syncSectors(tenantId, area.id, area.sectors, transaction);
        return;
      }
      const created = await ClientArea.create(
        areaPayload(tenantId, clientId, addressId, area),
        { transaction }
      );
      await syncAreaServices(tenantId, created.id, area.services, transaction);
      await syncSectors(tenantId, created.id, area.sectors, transaction);
    })
  );

  const idsToDelete = existing
    .map(area => area.id)
    .filter(id => !receivedIds.has(id));
  if (idsToDelete.length) {
    await deleteAreaChildren(tenantId, idsToDelete, transaction);
    await ClientArea.destroy({
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
    await syncAreas(tenantId, created.id, data.areas, addressIds, transaction);
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
    await syncAreas(tenantId, client.id, data.areas, addressIds, transaction);
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
    const areas = await ClientArea.findAll({
      where: { tenantId, clientId: client.id },
      attributes: ["id"],
      transaction
    });
    await deleteAreaChildren(
      tenantId,
      areas.map(area => area.id),
      transaction
    );
    await ClientArea.destroy({
      where: { tenantId, clientId: client.id },
      transaction
    });
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

const ensureClientAddress = async (
  tenantId: string | number,
  clientId: string | number,
  addressId: string | number
): Promise<ClientAddress> => {
  const address = await ClientAddress.findOne({
    where: { id: addressId, clientId, tenantId }
  });
  if (!address) throw new AppError("ERR_CLIENT_ADDRESS_NOT_FOUND", 404);
  return address;
};

const showArea = async (
  tenantId: string | number,
  areaId: string | number
): Promise<ClientArea> => {
  const area = await ClientArea.findOne({
    where: { id: areaId, tenantId },
    include: areaInclude
  });
  if (!area) throw new AppError("ERR_CLIENT_AREA_NOT_FOUND", 404);
  return area;
};

export const listAreas = async (
  tenantId: string | number,
  clientId: string,
  addressId?: string
): Promise<ClientArea[]> => {
  await Client.findOne({ where: { id: clientId, tenantId } }).then(client => {
    if (!client) throw new AppError("ERR_CLIENT_NOT_FOUND", 404);
  });
  return ClientArea.findAll({
    where: {
      tenantId,
      clientId,
      ...(addressId ? { addressId } : {})
    },
    include: areaInclude,
    order: [
      ["name", "ASC"],
      [{ model: ClientSector, as: "sectors" }, "name", "ASC"]
    ]
  });
};

export const createArea = async (
  tenantId: string | number,
  clientId: string,
  data: AreaData
): Promise<ClientArea> => {
  if (!data.addressId) throw new AppError("ERR_CLIENT_AREA_ADDRESS_REQUIRED");
  await ensureClientAddress(tenantId, clientId, data.addressId);
  const area = await sequelize.transaction(async transaction => {
    const created = await ClientArea.create(
      areaPayload(tenantId, Number(clientId), data.addressId as number, data),
      { transaction }
    );
    await syncAreaServices(tenantId, created.id, data.services, transaction);
    await syncSectors(tenantId, created.id, data.sectors, transaction);
    return created;
  });
  return showArea(tenantId, area.id);
};

export const updateArea = async (
  tenantId: string | number,
  clientId: string,
  areaId: string,
  data: AreaData
): Promise<ClientArea> => {
  const area = await ClientArea.findOne({
    where: { id: areaId, tenantId, clientId }
  });
  if (!area) throw new AppError("ERR_CLIENT_AREA_NOT_FOUND", 404);
  const addressId = data.addressId || area.addressId;
  await ensureClientAddress(tenantId, clientId, addressId);
  await sequelize.transaction(async transaction => {
    await area.update(
      areaPayload(tenantId, Number(clientId), addressId, data),
      { transaction }
    );
    await syncAreaServices(tenantId, area.id, data.services, transaction);
    await syncSectors(tenantId, area.id, data.sectors, transaction);
  });
  return showArea(tenantId, areaId);
};

export const deleteArea = async (
  tenantId: string | number,
  clientId: string,
  areaId: string
): Promise<void> => {
  const area = await ClientArea.findOne({
    where: { id: areaId, tenantId, clientId }
  });
  if (!area) throw new AppError("ERR_CLIENT_AREA_NOT_FOUND", 404);
  await sequelize.transaction(async transaction => {
    await deleteAreaChildren(tenantId, [area.id], transaction);
    await area.destroy({ transaction });
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
