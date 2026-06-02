import { Op, fn, col, where } from "sequelize";
import sequelize from "../../database";
import AppError from "../../errors/AppError";
import Contact from "../../models/Contact";
import CustomerAddress from "../../models/CustomerAddress";
import DeliveryZone from "../../models/DeliveryZone";

interface AddressData {
  contactId: number;
  label: string;
  street: string;
  number: string;
  district: string;
  city: string;
  state: string;
  zipCode: string;
  complement?: string | null;
  reference?: string | null;
  isDefault?: boolean;
}

interface ZoneData {
  name: string;
  district?: string | null;
  zipCodeStart?: string | null;
  zipCodeEnd?: string | null;
  deliveryFee: number;
  estimatedMinutes: number;
  active?: boolean;
}

const normalizeZipCode = (zipCode?: string | null): string | null =>
  zipCode ? zipCode.replace(/\D/g, "") : null;

const ensureContact = async (
  tenantId: string | number,
  contactId: number
): Promise<void> => {
  const contact = await Contact.findOne({ where: { id: contactId, tenantId } });
  if (!contact) throw new AppError("ERR_NO_CONTACT_FOUND", 404);
};

export const listAddresses = async (
  tenantId: string | number,
  contactId: number
): Promise<CustomerAddress[]> => {
  await ensureContact(tenantId, contactId);
  return CustomerAddress.findAll({
    where: { tenantId, contactId },
    order: [
      ["isDefault", "DESC"],
      ["label", "ASC"]
    ]
  });
};

const clearDefaultAddress = (
  tenantId: string | number,
  contactId: number,
  transaction: LegacyAny
) =>
  CustomerAddress.update(
    { isDefault: false },
    { where: { tenantId, contactId }, transaction }
  );

export const createAddress = async (
  tenantId: string | number,
  data: AddressData
): Promise<CustomerAddress> => {
  await ensureContact(tenantId, data.contactId);
  return sequelize.transaction(async transaction => {
    if (data.isDefault) {
      await clearDefaultAddress(tenantId, data.contactId, transaction);
    }
    return CustomerAddress.create(
      { ...data, zipCode: normalizeZipCode(data.zipCode), tenantId },
      { transaction }
    );
  });
};

export const updateAddress = async (
  tenantId: string | number,
  addressId: string,
  data: AddressData
): Promise<CustomerAddress> => {
  await ensureContact(tenantId, data.contactId);
  const address = await CustomerAddress.findOne({
    where: { id: addressId, tenantId }
  });
  if (!address) throw new AppError("ERR_NO_CUSTOMER_ADDRESS_FOUND", 404);

  return sequelize.transaction(async transaction => {
    if (data.isDefault) {
      await clearDefaultAddress(tenantId, data.contactId, transaction);
    }
    await address.update(
      { ...data, zipCode: normalizeZipCode(data.zipCode) },
      { transaction }
    );
    return address;
  });
};

export const deleteAddress = async (
  tenantId: string | number,
  addressId: string
): Promise<void> => {
  const address = await CustomerAddress.findOne({
    where: { id: addressId, tenantId }
  });
  if (!address) throw new AppError("ERR_NO_CUSTOMER_ADDRESS_FOUND", 404);
  await address.destroy();
};

export const listZones = async (
  tenantId: string | number
): Promise<DeliveryZone[]> =>
  DeliveryZone.findAll({ where: { tenantId }, order: [["name", "ASC"]] });

export const createZone = async (
  tenantId: string | number,
  data: ZoneData
): Promise<DeliveryZone> =>
  DeliveryZone.create({
    ...data,
    zipCodeStart: normalizeZipCode(data.zipCodeStart),
    zipCodeEnd: normalizeZipCode(data.zipCodeEnd),
    tenantId
  });

export const updateZone = async (
  tenantId: string | number,
  zoneId: string,
  data: ZoneData
): Promise<DeliveryZone> => {
  const zone = await DeliveryZone.findOne({ where: { id: zoneId, tenantId } });
  if (!zone) throw new AppError("ERR_NO_DELIVERY_ZONE_FOUND", 404);
  await zone.update({
    ...data,
    zipCodeStart: normalizeZipCode(data.zipCodeStart),
    zipCodeEnd: normalizeZipCode(data.zipCodeEnd)
  });
  return zone;
};

export const deleteZone = async (
  tenantId: string | number,
  zoneId: string
): Promise<void> => {
  const zone = await DeliveryZone.findOne({ where: { id: zoneId, tenantId } });
  if (!zone) throw new AppError("ERR_NO_DELIVERY_ZONE_FOUND", 404);
  await zone.destroy();
};

export const resolveZone = async (
  tenantId: string | number,
  district?: string,
  zipCode?: string
): Promise<DeliveryZone> => {
  const normalizedZipCode = normalizeZipCode(zipCode);
  let zone: DeliveryZone | null = null;
  if (normalizedZipCode) {
    zone = await DeliveryZone.findOne({
      where: {
        tenantId,
        active: true,
        zipCodeStart: { [Op.lte]: normalizedZipCode },
        zipCodeEnd: { [Op.gte]: normalizedZipCode }
      },
      order: [["zipCodeStart", "DESC"]]
    });
  }
  if (!zone && district?.trim()) {
    zone = await DeliveryZone.findOne({
      where: {
        tenantId,
        active: true,
        [Op.and]: where(
          fn("lower", col("district")),
          district.trim().toLowerCase()
        )
      }
    });
  }
  if (!zone) throw new AppError("ERR_NO_DELIVERY_ZONE_FOUND", 404);
  return zone;
};
