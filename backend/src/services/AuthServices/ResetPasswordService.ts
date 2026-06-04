import { createHash } from "crypto";
import { Op } from "sequelize";
import * as Yup from "yup";
import AppError from "../../errors/AppError";
import {
  MIN_PASSWORD_LENGTH,
  PASSWORD_POLICY_MESSAGE
} from "../../helpers/UserSecurity";
import User from "../../models/User";

interface Request {
  token: string;
  password: string;
}

const hashToken = (token: string): string =>
  createHash("sha256").update(token).digest("hex");

export const ResetPasswordService = async ({
  token,
  password
}: Request): Promise<void> => {
  const schema = Yup.object().shape({
    token: Yup.string().required(),
    password: Yup.string()
      .required()
      .min(MIN_PASSWORD_LENGTH, PASSWORD_POLICY_MESSAGE)
      .max(72)
  });

  try {
    await schema.validate({ token, password });
  } catch (error) {
    throw new AppError("ERR_PASSWORD_RESET_INVALID_DATA");
  }

  const user = await User.findOne({
    where: {
      passwordResetTokenHash: hashToken(token),
      passwordResetExpires: { [Op.gt]: new Date() }
    }
  });

  if (!user) {
    throw new AppError("ERR_PASSWORD_RESET_INVALID_TOKEN");
  }

  await user.update({
    password,
    passwordResetTokenHash: null,
    passwordResetExpires: null,
    tokenVersion: user.tokenVersion + 1
  });
};
