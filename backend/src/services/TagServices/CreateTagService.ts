// import AppError from "../../errors/AppError";
import Tag from "../../models/Tag";

interface Request {
  tag: string;
  color: string;
  isActive: boolean;
  userId: string | number;
  tenantId: number | string;
}

const CreateTagService = async ({
  tag,
  color,
  isActive,
  userId,
  tenantId
}: Request): Promise<Tag> => {
  const tagData = await Tag.create({
    tag,
    color,
    isActive,
    userId,
    tenantId
  } as LegacyAny);

  return tagData;
};

export default CreateTagService;
