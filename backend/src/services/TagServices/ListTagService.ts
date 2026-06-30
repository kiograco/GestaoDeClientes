import Tag from "../../models/Tag";

interface Request {
  tenantId: number;
  isActive?: string | boolean | null;
}

const ListTagService = async ({
  tenantId,
  isActive
}: Request): Promise<Tag[]> => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: LegacyAny = {
    tenantId
  };

  if (isActive) {
    where.isActive = isActive;
  }

  const tagData = await Tag.findAll({
    where,
    order: [["tag", "ASC"]]
  });

  return tagData;
};

export default ListTagService;
