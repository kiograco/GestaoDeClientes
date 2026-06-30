// import AppError from "../../errors/AppError";
import AutoReply from "../../models/AutoReply";

interface Request {
  name: string;
  action: number;
  userId: string | number;
  tenantId: number | string;
}

const CreateAutoReplyService = async ({
  name,
  action,
  userId,
  tenantId
}: Request): Promise<AutoReply> => {
  const autoReply = await AutoReply.create({
    name,
    action,
    userId,
    tenantId
  } as LegacyAny);

  return autoReply;
};

export default CreateAutoReplyService;
