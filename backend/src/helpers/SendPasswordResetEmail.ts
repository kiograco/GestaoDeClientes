import {
  assertEmailConfigured,
  sendPasswordRecovery
} from "../services/EmailServices/EmailService";

export { assertEmailConfigured };

export const SendPasswordResetEmail = async (
  tenantId: string | number,
  email: string,
  token: string
): Promise<void> => {
  assertEmailConfigured();
  const frontendUrl = (
    process.env.FRONTEND_URL || "http://localhost:8080"
  ).replace(/\/$/, "");
  const resetUrl = `${frontendUrl}/login?tokenSetup=${encodeURIComponent(
    token
  )}`;
  await sendPasswordRecovery(tenantId, email, resetUrl);
};
