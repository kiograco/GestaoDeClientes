import {
  assertEmailConfigured,
  sendPasswordRecovery
} from "../services/EmailServices/EmailService";
import { getPrimaryFrontendUrl } from "../utils/frontendUrl";

export { assertEmailConfigured };

export const SendPasswordResetEmail = async (
  tenantId: number,
  email: string,
  token: string
): Promise<void> => {
  assertEmailConfigured();
  const frontendUrl = getPrimaryFrontendUrl();
  const resetUrl = `${frontendUrl}/login?tokenSetup=${encodeURIComponent(
    token
  )}`;
  await sendPasswordRecovery(tenantId, email, resetUrl);
};
