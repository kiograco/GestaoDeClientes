import AppError from "../../errors/AppError";
import {
  createTotpUri,
  generateTotpSecret,
  verifyTotpCode
} from "../../helpers/Totp";
import User from "../../models/User";

interface MfaConfig {
  enabled?: boolean;
  pendingSecret?: string;
  secret?: string;
  enabledAt?: string;
}

const getConfigs = (user: User): LegacyAny => user.configs || {};

const getMfaConfig = (user: User): MfaConfig => getConfigs(user).mfa || {};

export const isMfaEnabled = (user: User): boolean =>
  !!getMfaConfig(user).enabled && !!getMfaConfig(user).secret;

export const verifyUserMfaCode = (user: User, code?: string): void => {
  if (!isMfaEnabled(user)) return;

  const secret = getMfaConfig(user).secret;
  if (!secret || !code || !verifyTotpCode(secret, code)) {
    throw new AppError("ERR_MFA_REQUIRED", 401);
  }
};

export const StartMfaSetupService = async (
  userId: string | number,
  tenantId: string | number
): Promise<{ secret: string; otpauthUrl: string }> => {
  const user = await User.findOne({ where: { id: userId, tenantId } });
  if (!user) throw new AppError("ERR_NO_USER_FOUND", 404);

  const secret = generateTotpSecret();
  const configs = getConfigs(user);
  await user.update({
    configs: {
      ...configs,
      mfa: {
        ...configs.mfa,
        pendingSecret: secret
      }
    }
  });

  return {
    secret,
    otpauthUrl: createTotpUri("NCProgrammers CRM", user.email, secret)
  };
};

export const ConfirmMfaSetupService = async (
  userId: string | number,
  tenantId: string | number,
  code: string
): Promise<void> => {
  const user = await User.findOne({ where: { id: userId, tenantId } });
  if (!user) throw new AppError("ERR_NO_USER_FOUND", 404);

  const configs = getConfigs(user);
  const pendingSecret = configs.mfa?.pendingSecret;
  if (!pendingSecret || !verifyTotpCode(pendingSecret, code)) {
    throw new AppError("ERR_INVALID_MFA_CODE", 400);
  }

  await user.update({
    configs: {
      ...configs,
      mfa: {
        enabled: true,
        secret: pendingSecret,
        enabledAt: new Date().toISOString()
      }
    },
    tokenVersion: user.tokenVersion + 1
  });
};

export const DisableMfaService = async (
  userId: string | number,
  tenantId: string | number,
  code: string
): Promise<void> => {
  const user = await User.findOne({ where: { id: userId, tenantId } });
  if (!user) throw new AppError("ERR_NO_USER_FOUND", 404);

  verifyUserMfaCode(user, code);
  const configs = getConfigs(user);

  await user.update({
    configs: {
      ...configs,
      mfa: { enabled: false }
    },
    tokenVersion: user.tokenVersion + 1
  });
};
