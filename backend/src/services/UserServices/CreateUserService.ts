import * as Yup from "yup";

import AppError from "../../errors/AppError";
import {
  MIN_PASSWORD_LENGTH,
  PASSWORD_POLICY_MESSAGE,
  TENANT_USER_PROFILES
} from "../../helpers/UserSecurity";
import User from "../../models/User";

interface Request {
  email: string;
  password: string;
  name: string;
  tenantId: string | number;
  profile?: string;
}

interface Response {
  email: string;
  name: string;
  id: number;
  profile: string;
}

const CreateUserService = async ({
  email,
  password,
  name,
  tenantId,
  profile = "admin"
}: Request): Promise<Response> => {
  const schema = Yup.object().shape({
    name: Yup.string().required().min(2),
    tenantId: Yup.number().required(),
    email: Yup.string()
      .email()
      .required()
      .test(
        "Check-email",
        "An user with this email already exists.",
        async value => {
          const emailExists = await User.findOne({
            where: { email: value! }
          });
          return !emailExists;
        }
      ),
    password: Yup.string()
      .required()
      .min(MIN_PASSWORD_LENGTH, PASSWORD_POLICY_MESSAGE),
    profile: Yup.string().oneOf(TENANT_USER_PROFILES)
  });

  try {
    await schema.validate({ email, password, name, tenantId, profile });
  } catch (err) {
    throw new AppError(err.message);
  }

  const user = await User.create({
    email,
    password,
    name,
    profile,
    tenantId
  });

  const serializedUser = {
    id: user.id,
    name: user.name,
    email: user.email,
    profile: user.profile
  };

  return serializedUser;
};

export default CreateUserService;
