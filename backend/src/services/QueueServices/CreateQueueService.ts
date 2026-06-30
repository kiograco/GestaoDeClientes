// import AppError from "../../errors/AppError";
import Queue from "../../models/Queue";

interface Request {
  queue: string;
  isActive: boolean;
  userId: string | number;
  tenantId: number | string;
}

const CreateQueueService = async ({
  queue,
  isActive,
  userId,
  tenantId
}: Request): Promise<Queue> => {
  const queueData = await Queue.create({
    queue,
    isActive,
    userId,
    tenantId
  } as LegacyAny);

  return queueData;
};

export default CreateQueueService;
