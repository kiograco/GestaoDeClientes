import { createHash, randomBytes } from "crypto";
import { col, fn, where } from "sequelize";
import AppError from "../../errors/AppError";
import {
  assertEmailConfigured,
  SendPasswordResetEmail
} from "../../helpers/SendPasswordResetEmail";
import User from "../../models/User";
import { logger } from "../../utils/logger";

const RESET_TOKEN_TTL_MS = 30 * 60 * 1000;

const hashToken = (token: string): string =>
  createHash("sha256").update(token).digest("hex");

export const RequestPasswordResetService = async (
  email: string
): Promise<void> => {
  try {
    assertEmailConfigured();
  } catch (error) {
    throw new AppError("ERR_PASSWORD_RESET_EMAIL_NOT_CONFIGURED", 503);
  }

  const normalizedEmail = email.trim().toLowerCase();
  const user = await User.findOne({
    where: where(fn("LOWER", col("email")), normalizedEmail)
  });

  if (!user) return;

  const token = randomBytes(32).toString("hex");

  await user.update({
    passwordResetTokenHash: hashToken(token),
    passwordResetExpires: new Date(Date.now() + RESET_TOKEN_TTL_MS)
  });

  try {
    await SendPasswordResetEmail(user.tenantId, user.email, token);
  } catch (error) {
    logger.error(
      `Password reset email failed: ${
        error instanceof Error ? error.message : "Unknown email provider error"
      }`
    );
    await user.update({
      passwordResetTokenHash: null,
      passwordResetExpires: null
    });
    throw new AppError("ERR_PASSWORD_RESET_EMAIL_SEND", 503);
  }
};
