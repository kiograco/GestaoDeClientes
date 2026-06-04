import { Op } from "sequelize";
import AppError from "../../errors/AppError";
import socketEmit from "../../helpers/socketEmit";
import Contact from "../../models/Contact";
import ContactCustomField from "../../models/ContactCustomField";
import ContactWallet from "../../models/ContactWallet";
import User from "../../models/User";

interface ExtraInfo {
  id?: number;
  name: string;
  value: string;
}

interface Wallet {
  walletId: number | string;
  contactId: number | string;
  tenantId: number | string;
}

interface ContactData {
  email?: string;
  number?: string;
  name?: string;
  extraInfo?: ExtraInfo[];
  wallets?: null | number[] | string[];
}

interface Request {
  contactData: ContactData;
  contactId: string;
  tenantId: string | number;
}

const UpdateContactService = async ({
  contactData,
  contactId,
  tenantId
}: Request): Promise<Contact> => {
  const { email, name, number, extraInfo, wallets } = contactData;

  const contact = await Contact.findOne({
    where: { id: contactId, tenantId },
    attributes: ["id", "name", "number", "email", "profilePicUrl"],
    include: [
      "extraInfo",
      "tags",
      {
        association: "wallets",
        attributes: ["id", "name"]
      }
    ]
  });

  if (!contact) {
    throw new AppError("ERR_NO_CONTACT_FOUND", 404);
  }

  if (extraInfo) {
    const currentExtraInfoIds = new Set(
      contact.extraInfo.map(info => Number(info.id))
    );

    await Promise.all(
      extraInfo.map(async info => {
        if (info.id && !currentExtraInfoIds.has(Number(info.id))) {
          throw new AppError("ERR_CONTACT_CUSTOM_FIELD_NOT_FOUND", 404);
        }

        await ContactCustomField.upsert({ ...info, contactId: contact.id });
      })
    );

    await Promise.all(
      contact.extraInfo.map(async oldInfo => {
        const stillExists = extraInfo.findIndex(info => info.id === oldInfo.id);

        if (stillExists === -1) {
          await ContactCustomField.destroy({
            where: { id: oldInfo.id, contactId: contact.id }
          });
        }
      })
    );
  }

  if (wallets) {
    const walletIds = [
      ...new Set(wallets.map((wallet: LegacyAny) => wallet?.id || wallet))
    ];

    if (walletIds.length) {
      const tenantWallets = await User.findAll({
        where: { id: { [Op.in]: walletIds }, tenantId },
        attributes: ["id"]
      });

      if (tenantWallets.length !== walletIds.length) {
        throw new AppError("ERR_WALLET_NOT_FOUND", 404);
      }
    }

    await ContactWallet.destroy({
      where: {
        tenantId,
        contactId
      }
    });

    const contactWallets: Wallet[] = walletIds.map(walletId => ({
      walletId,
      contactId,
      tenantId
    }));

    await ContactWallet.bulkCreate(contactWallets);
  }

  await contact.update({
    name,
    number,
    email
  });

  await contact.reload({
    attributes: ["id", "name", "number", "email", "profilePicUrl"],
    include: [
      "extraInfo",
      "tags",
      {
        association: "wallets",
        attributes: ["id", "name"]
      }
    ]
  });

  socketEmit({
    tenantId,
    type: "contact:update",
    payload: contact
  });

  return contact;
};

export default UpdateContactService;
