import { Op } from "sequelize";
import AppError from "../../errors/AppError";
import Contact from "../../models/Contact";
import ContactWallet from "../../models/ContactWallet";
import User from "../../models/User";

interface Request {
  wallets: number[] | string[];
  contactId: string;
  tenantId: string | number;
}

interface Wallet {
  walletId: number | string;
  contactId: number | string;
  tenantId: number | string;
}

const UpdateContactWalletsService = async ({
  wallets,
  contactId,
  tenantId
}: Request): Promise<Contact> => {
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

  return contact;
};

export default UpdateContactWalletsService;
