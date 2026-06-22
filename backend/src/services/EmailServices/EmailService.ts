import path from "path";
import * as Yup from "yup";
import EmailLog from "../../models/EmailLog";
import Tenant from "../../models/Tenant";
import { logger } from "../../utils/logger";
import { EmailAttachment, EmailProvider } from "./EmailProvider";
import ResendEmailProvider from "./ResendEmailProvider";
import { EmailTemplateName, renderEmailTemplate } from "./EmailTemplateService";

const DEFAULT_FROM =
  "Ebenezer Saude Ambiental <os@ebenezersaudeambiental.com.br>";
const DEFAULT_REPLY_TO = "atendimento@ebenezersaudeambiental.com.br";
const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024;

export interface SendEmailData {
  tenantId: string | number;
  to: string;
  subject: string;
  template: EmailTemplateName;
  variables: Record<string, unknown>;
  attachments?: EmailAttachment[];
}

export const assertEmailConfigured = (): void => {
  if (!process.env.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY must be configured");
  }
};

const validateAttachments = (attachments: EmailAttachment[] = []): void => {
  attachments.forEach(attachment => {
    if (path.basename(attachment.filename) !== attachment.filename) {
      throw new Error("Nome de anexo invalido");
    }
    if (attachment.content.length > MAX_ATTACHMENT_BYTES) {
      throw new Error("Anexo excede o limite de 10 MB");
    }
    if (
      attachment.contentType &&
      attachment.contentType !== "application/pdf"
    ) {
      throw new Error("Tipo de anexo nao permitido");
    }
  });
};

const emailSchema = Yup.string().trim().email().required();

const createProvider = (): EmailProvider => {
  assertEmailConfigured();
  return new ResendEmailProvider(process.env.RESEND_API_KEY as string);
};

export const sendEmail = async (data: SendEmailData): Promise<string> => {
  const recipient = await emailSchema.validate(data.to);
  const tenant = await Tenant.findByPk(data.tenantId, {
    attributes: ["id", "name", "logoUrl", "mailSettings"]
  });
  if (!tenant) throw new Error("Tenant nao encontrado");
  validateAttachments(data.attachments);

  const settings = tenant.mailSettings || {};
  const configuredFrom = process.env.MAIL_FROM || DEFAULT_FROM;
  const fromAddress = configuredFrom.match(/<([^>]+)>/)?.[1] || configuredFrom;
  const from = settings.senderName
    ? `${settings.senderName} <${fromAddress}>`
    : configuredFrom;
  const replyTo =
    settings.replyTo || process.env.MAIL_REPLY_TO || DEFAULT_REPLY_TO;
  let providerMessageId: string | null = null;
  let errorMessage: string | null = null;
  const providerName = "resend";

  try {
    const provider = createProvider();
    const html = await renderEmailTemplate(data.template, {
      ...data.variables,
      company_name: tenant.name,
      logo_url: tenant.logoUrl || "",
      footer_signature: settings.footerSignature || tenant.name
    });
    const result = await provider.send({
      from,
      to: recipient,
      replyTo,
      subject: data.subject.slice(0, 255),
      html,
      attachments: data.attachments
    });
    providerMessageId = result.id;
    return result.id;
  } catch (error) {
    errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
    throw error;
  } finally {
    try {
      await EmailLog.create({
        tenantId: Number(data.tenantId),
        recipient,
        subject: data.subject.slice(0, 255),
        template: data.template,
        provider: providerName,
        status: providerMessageId ? "sent" : "failed",
        providerMessageId,
        errorMessage: errorMessage?.slice(0, 2000) || null
      });
    } catch (logError) {
      logger.error(`Email log persistence failed: ${logError}`);
    }
  }
};

export const sendPasswordRecovery = async (
  tenantId: string | number,
  email: string,
  resetUrl: string
): Promise<string> =>
  sendEmail({
    tenantId,
    to: email,
    subject: "Redefinicao de senha - Ebenezer Saude Ambiental",
    template: "password-reset",
    variables: { reset_url: resetUrl }
  });

export const sendOrderService = async (
  data: Omit<SendEmailData, "template">
): Promise<string> => sendEmail({ ...data, template: "order-service" });

export const sendInspectionReport = async (
  data: Omit<SendEmailData, "template">
): Promise<string> => sendEmail({ ...data, template: "inspection-report" });

export const sendFinancialNotification = async (
  data: Omit<SendEmailData, "template">
): Promise<string> =>
  sendEmail({ ...data, template: "financial-notification" });

export const sendWelcomeEmail = async (
  data: Omit<SendEmailData, "template">
): Promise<string> => sendEmail({ ...data, template: "welcome" });
