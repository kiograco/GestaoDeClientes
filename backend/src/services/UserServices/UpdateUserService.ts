import * as Yup from "yup";
import { Op } from "sequelize";

import AppError from "../../errors/AppError";
import Queue from "../../models/Queue";
import User from "../../models/User";
import UsersQueues from "../../models/UsersQueues";

interface UserQueues {
  id?: number;
  queue?: number;
}

interface UserData {
  email?: string;
  password?: string;
  name?: string;
  profile?: string;
  queues?: UserQueues[];
}

interface Request {
  userData: UserData;
  userId: string | number;
  tenantId: string | number;
}

interface Response {
  id: number;
  name: string;
  email: string;
  profile: string;
}

const UpdateUserService = async ({
  userData,
  userId,
  tenantId
}: Request): Promise<Response | undefined> => {
  const user = await User.findOne({
    where: { id: userId, tenantId },
    attributes: ["name", "id", "email", "profile"]
  });

  if (!user) {
    throw new AppError("ERR_NO_USER_FOUND", 404);
  }

  const schema = Yup.object().shape({
    name: Yup.string().min(2),
    email: Yup.string().email(),
    profile: Yup.string(),
    password: Yup.string()
  });

  const { email, password, profile, name, queues } = userData;

  try {
    await schema.validate({ email, password, profile, name });
  } catch (err: LegacyAny) {
    throw new AppError(err?.message);
  }

  if (queues) {
    const queueIds = queues.map((queue: LegacyAny) => queue?.id || queue);
    const tenantQueues = await Queue.findAll({
      where: { id: { [Op.in]: queueIds }, tenantId },
      attributes: ["id"]
    });
    if (tenantQueues.length !== queueIds.length) {
      throw new AppError("ERR_QUEUE_NOT_FOUND", 404);
    }

    await UsersQueues.destroy({ where: { userId } });
    await Promise.all(
      queueIds.map(async (queueId: number) => {
        await UsersQueues.upsert({ queueId, userId });
      })
    );
  }

  await user.update({
    email,
    password,
    profile,
    name
  });

  await user.reload({
    attributes: ["id", "name", "email", "profile"],
    include: [{ model: Queue, attributes: ["id", "queue"] }]
  });

  const serializedUser = {
    id: user.id,
    name: user.name,
    email: user.email,
    profile: user.profile,
    queues: user.queues
  };

  return serializedUser;
};

export default UpdateUserService;
