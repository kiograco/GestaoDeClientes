import axios from "axios";
import { Op } from "sequelize";
import sequelize from "../../database";
import AppError from "../../errors/AppError";
import Contact from "../../models/Contact";
import CustomerAddress from "../../models/CustomerAddress";
import CustomerProfile from "../../models/CustomerProfile";

interface AddressData {
  id?: number;
  label: string;
  street: string;
  number: string;
  district: string;
  city: string;
  state: string;
  zipCode: string;
  complement?: string | null;
  reference?: string | null;
}

export interface CustomerData {
  name: string;
  number: string;
  email?: string | null;
  document?: string | null;
  secondaryPhone?: string | null;
  companyName?: string | null;
  birthDate?: string | null;
  salesStatus?: string;
  source?: string | null;
  notes?: string | null;
  address: AddressData;
}

const normalizeDigits = (value?: string | null): string =>
  value ? value.replace(/\D/g, "") : "";

const customerInclude = [
  { model: CustomerProfile, as: "salesProfile", required: false },
  {
    model: CustomerAddress,
    as: "addresses",
    where: { isDefault: true },
    required: false
  }
];

export const listCustomers = async (
  tenantId: string | number,
  searchParam = ""
): Promise<Contact[]> => {
  const search = searchParam.trim();
  const digits = normalizeDigits(search);
  const searchConditions: LegacyAny[] = [
    { name: { [Op.iLike]: `%${search}%` } },
    { email: { [Op.iLike]: `%${search}%` } },
    { "$salesProfile.document$": { [Op.like]: `%${search}%` } },
    { "$salesProfile.companyName$": { [Op.iLike]: `%${search}%` } }
  ];
  if (digits) {
    searchConditions.push({ number: { [Op.like]: `%${digits}%` } });
  }
  return Contact.findAll({
    where: {
      tenantId,
      ...(search
        ? {
            [Op.or]: [...searchConditions]
          }
        : {})
    },
    attributes: ["id", "name", "number", "email", "profilePicUrl"],
    include: customerInclude,
    order: [["name", "ASC"]]
  });
};

export const showCustomer = async (
  tenantId: string | number,
  contactId: string
): Promise<Contact> => {
  const contact = await Contact.findOne({
    where: { id: contactId, tenantId },
    attributes: ["id", "name", "number", "email", "profilePicUrl"],
    include: customerInclude
  });
  if (!contact) throw new AppError("ERR_NO_CONTACT_FOUND", 404);
  return contact;
};

const ensureUniqueNumber = async (
  tenantId: string | number,
  number: string,
  contactId?: string
) => {
  const duplicate = await Contact.findOne({
    where: {
      tenantId,
      number,
      ...(contactId ? { id: { [Op.ne]: contactId } } : {})
    }
  });
  if (duplicate) throw new AppError("ERR_DUPLICATED_CONTACT");
};

const saveAddress = async (
  tenantId: string | number,
  contactId: number,
  addressData: AddressData,
  transaction: LegacyAny
) => {
  const data = {
    ...addressData,
    zipCode: normalizeDigits(addressData.zipCode),
    label: addressData.label || "Principal",
    tenantId,
    contactId,
    isDefault: true
  };
  const address = addressData.id
    ? await CustomerAddress.findOne({
        where: { id: addressData.id, tenantId, contactId },
        transaction
      })
    : await CustomerAddress.findOne({
        where: { tenantId, contactId, isDefault: true },
        transaction
      });
  if (address) {
    await address.update(data, { transaction });
    return;
  }
  await CustomerAddress.create(data, { transaction });
};

const saveProfile = async (
  tenantId: string | number,
  contactId: number,
  data: CustomerData,
  transaction: LegacyAny
) => {
  const profileData = {
    tenantId,
    contactId,
    document: normalizeDigits(data.document) || null,
    secondaryPhone: normalizeDigits(data.secondaryPhone) || null,
    companyName: data.companyName || null,
    birthDate: data.birthDate || null,
    salesStatus: data.salesStatus || "LEAD",
    source: data.source || null,
    notes: data.notes || null
  };
  const profile = await CustomerProfile.findOne({
    where: { tenantId, contactId },
    transaction
  });
  if (profile) {
    await profile.update(profileData, { transaction });
    return;
  }
  await CustomerProfile.create(profileData, { transaction });
};

export const createCustomer = async (
  tenantId: string | number,
  data: CustomerData
): Promise<Contact> => {
  const number = normalizeDigits(data.number);
  await ensureUniqueNumber(tenantId, number);
  const contact = await sequelize.transaction(async transaction => {
    const created = await Contact.create(
      { name: data.name, number, email: data.email || null, tenantId },
      { transaction }
    );
    await saveProfile(tenantId, created.id, data, transaction);
    await saveAddress(tenantId, created.id, data.address, transaction);
    return created;
  });
  return showCustomer(tenantId, String(contact.id));
};

export const updateCustomer = async (
  tenantId: string | number,
  contactId: string,
  data: CustomerData
): Promise<Contact> => {
  const number = normalizeDigits(data.number);
  await ensureUniqueNumber(tenantId, number, contactId);
  const contact = await Contact.findOne({ where: { id: contactId, tenantId } });
  if (!contact) throw new AppError("ERR_NO_CONTACT_FOUND", 404);

  await sequelize.transaction(async transaction => {
    await contact.update(
      { name: data.name, number, email: data.email || null },
      { transaction }
    );
    await saveProfile(tenantId, contact.id, data, transaction);
    await saveAddress(tenantId, contact.id, data.address, transaction);
  });
  return showCustomer(tenantId, contactId);
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
