import { Op } from "sequelize";
import AppError from "../../errors/AppError";
import Contact from "../../models/Contact";
import ContactTag from "../../models/ContactTag";
import Tag from "../../models/Tag";

interface Request {
  tags: number[] | string[];
  contactId: string;
  tenantId: string | number;
}

interface ContactTagData {
  tagId: number | string;
  contactId: number | string;
  tenantId: number | string;
}

const UpdateContactService = async ({
  tags,
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

  const tagIds = [...new Set(tags.map((tag: LegacyAny) => tag?.id || tag))];

  if (tagIds.length) {
    const tenantTags = await Tag.findAll({
      where: { id: { [Op.in]: tagIds }, tenantId },
      attributes: ["id"]
    });

    if (tenantTags.length !== tagIds.length) {
      throw new AppError("ERR_TAG_NOT_FOUND", 404);
    }
  }

  await ContactTag.destroy({
    where: {
      tenantId,
      contactId
    }
  });

  const contactTags: ContactTagData[] = tagIds.map(tagId => ({
    tagId,
    contactId,
    tenantId
  }));

  await ContactTag.bulkCreate(contactTags);

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

export default UpdateContactService;
