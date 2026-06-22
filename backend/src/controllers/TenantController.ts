import * as Yup from "yup";
import { Request, Response } from "express";
import { isMatch } from "date-fns";
import AppError from "../errors/AppError";

import UpdateBusinessHoursService from "../services/TenantServices/UpdateBusinessHoursService";
import ShowBusinessHoursAndMessageService from "../services/TenantServices/ShowBusinessHoursAndMessageService";
import UpdateMessageBusinessHoursService from "../services/TenantServices/UpdateMessageBusinessHoursService";
import Tenant from "../models/Tenant";
import User from "../models/User";
import EmailLog from "../models/EmailLog";
import createAuditLog from "../services/AuditLogService";
import { sendEmail } from "../services/EmailServices/EmailService";

export const updateBusinessHours = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { tenantId } = req.user;

  if (req.user.profile !== "admin") {
    throw new AppError("ERR_NO_PERMISSION", 403);
  }

  const businessHours = req.body;

  const schema = Yup.array().of(
    Yup.object().shape({
      day: Yup.number().required().integer(),
      label: Yup.string().required(),
      type: Yup.string().required(),
      hr1: Yup.string()
        .required()
        // eslint-disable-next-line no-template-curly-in-string
        .test("isHoursValid", "${path} is not valid", value =>
          isMatch(value || "", "HH:mm")
        ),
      hr2: Yup.string()
        .required()
        // eslint-disable-next-line no-template-curly-in-string
        .test("isHoursValid", "${path} is not valid", value => {
          return isMatch(value || "", "HH:mm");
        }),
      hr3: Yup.string()
        .required()
        // eslint-disable-next-line no-template-curly-in-string
        .test("isHoursValid", "${path} is not valid", value =>
          isMatch(value || "", "HH:mm")
        ),
      hr4: Yup.string()
        .required()
        // eslint-disable-next-line no-template-curly-in-string
        .test("isHoursValid", "${path} is not valid", value =>
          isMatch(value || "", "HH:mm")
        )
    })
  );

  try {
    await schema.validate(businessHours);
  } catch (error) {
    throw new AppError(error.message);
  }

  const newBusinessHours = await UpdateBusinessHoursService({
    businessHours,
    tenantId
  });

  return res.status(200).json(newBusinessHours);
};

export const updateMessageBusinessHours = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { tenantId } = req.user;

  if (req.user.profile !== "admin") {
    throw new AppError("ERR_NO_PERMISSION", 403);
  }

  const { messageBusinessHours } = req.body;

  if (!messageBusinessHours) {
    throw new AppError("ERR_NO_MESSAGE_INFORMATION", 404);
  }

  const newBusinessHours = await UpdateMessageBusinessHoursService({
    messageBusinessHours,
    tenantId
  });

  return res.status(200).json(newBusinessHours);
};

export const showBusinessHoursAndMessage = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { tenantId } = req.user;

  const tenant = await ShowBusinessHoursAndMessageService({ tenantId });

  return res.status(200).json(tenant);
};

export const updateLogo = async (
  req: Request,
  res: Response
): Promise<Response> => {
  if (req.user.profile !== "admin") {
    throw new AppError("ERR_NO_PERMISSION", 403);
  }

  if (!req.file) {
    throw new AppError("ERR_TENANT_LOGO_REQUIRED", 400);
  }

  const tenant = await Tenant.findByPk(req.user.tenantId);
  if (!tenant) {
    throw new AppError("ERR_NO_TENANT_FOUND", 404);
  }

  const logoUrl = `/public/logos/${req.file.filename}`;
  await tenant.update({ logoUrl });

  return res.status(200).json({
    name: tenant.name,
    logoUrl: tenant.logoUrl
  });
};

const mailSettingsSchema = Yup.object().shape({
  senderName: Yup.string()
    .trim()
    .min(2)
    .max(100)
    .matches(/^[^<>\r\n]+$/, "Nome do remetente invalido")
    .required(),
  replyTo: Yup.string().trim().email().max(255).required(),
  footerSignature: Yup.string().trim().max(1000).required()
});

export const showMailSettings = async (
  req: Request,
  res: Response
): Promise<Response> => {
  if (req.user.profile !== "admin")
    throw new AppError("ERR_NO_PERMISSION", 403);
  const tenant = await Tenant.findByPk(req.user.tenantId, {
    attributes: ["id", "name", "logoUrl", "mailSettings"]
  });
  if (!tenant) throw new AppError("ERR_NO_TENANT_FOUND", 404);
  return res.json(tenant);
};

export const updateMailSettings = async (
  req: Request,
  res: Response
): Promise<Response> => {
  if (req.user.profile !== "admin")
    throw new AppError("ERR_NO_PERMISSION", 403);
  let settings: {
    senderName: string;
    replyTo: string;
    footerSignature: string;
  };
  try {
    settings = (await mailSettingsSchema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    })) as { senderName: string; replyTo: string; footerSignature: string };
  } catch (error) {
    throw new AppError(error.message, 400);
  }
  const tenant = await Tenant.findByPk(req.user.tenantId);
  if (!tenant) throw new AppError("ERR_NO_TENANT_FOUND", 404);
  await tenant.update({ mailSettings: settings });
  await createAuditLog({
    tenantId: req.user.tenantId,
    userId: req.user.id,
    action: "tenant_mail_settings_updated",
    resource: "tenant_mail_settings",
    resourceId: tenant.id,
    ip: req.ip,
    userAgent: req.get("user-agent"),
    metadata: { replyTo: settings.replyTo }
  });
  return res.json({
    name: tenant.name,
    logoUrl: tenant.logoUrl,
    mailSettings: settings
  });
};

export const sendTestEmail = async (
  req: Request,
  res: Response
): Promise<Response> => {
  if (req.user.profile !== "admin")
    throw new AppError("ERR_NO_PERMISSION", 403);
  const user = await User.findOne({
    where: { id: req.user.id, tenantId: req.user.tenantId },
    attributes: ["id", "email"]
  });
  if (!user) throw new AppError("ERR_NO_USER_FOUND", 404);
  const messageId = await sendEmail({
    tenantId: req.user.tenantId,
    to: user.email,
    subject: "Teste de envio - Ebenezer Saude Ambiental",
    template: "operational-notification",
    variables: {
      title: "Configuracao de e-mail validada",
      client_name: user.email,
      message:
        "O CRM conseguiu enviar esta mensagem pelo provedor configurado.",
      event_date: new Date().toLocaleString("pt-BR")
    }
  });
  await createAuditLog({
    tenantId: req.user.tenantId,
    userId: req.user.id,
    action: "tenant_test_email_sent",
    resource: "tenant_mail_settings",
    resourceId: req.user.tenantId,
    ip: req.ip,
    userAgent: req.get("user-agent"),
    metadata: { providerMessageId: messageId }
  });
  return res.json({ messageId });
};

export const listEmailLogs = async (
  req: Request,
  res: Response
): Promise<Response> => {
  if (req.user.profile !== "admin")
    throw new AppError("ERR_NO_PERMISSION", 403);
  const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), 100);
  const logs = await EmailLog.findAll({
    where: { tenantId: req.user.tenantId },
    limit,
    order: [["createdAt", "DESC"]]
  });
  return res.json(logs);
};
