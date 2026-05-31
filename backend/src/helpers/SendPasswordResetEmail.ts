import { Resend } from "resend";

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

export const assertEmailConfigured = (): void => {
  if (!process.env.RESEND_API_KEY || !process.env.RESEND_FROM_EMAIL) {
    throw new Error("RESEND_API_KEY and RESEND_FROM_EMAIL must be configured");
  }
};

export const SendPasswordResetEmail = async (
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
  const resend = new Resend(process.env.RESEND_API_KEY);
  const { error } = await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL!,
    to: email,
    subject: "Redefinicao de senha - NCProgrammers CRM",
    html: `
      <p>Foi solicitada a redefinicao da sua senha no NCProgrammers CRM.</p>
      <p><a href="${escapeHtml(
        resetUrl
      )}">Clique aqui para cadastrar uma nova senha</a>.</p>
      <p>Este link expira em 30 minutos e pode ser utilizado uma unica vez.</p>
      <p>Caso voce nao tenha solicitado a redefinicao, ignore esta mensagem.</p>
    `
  });

  if (error) {
    throw new Error(error.message);
  }
};
