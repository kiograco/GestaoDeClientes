import { Request, Response } from "express";
import ShowWhatsAppService from "../services/WhatsappService/ShowWhatsAppService";
import GetMetaMessageTemplates from "../services/WABAMeta/GetMetaMessageTemplates";
import SendWabaMetaTemplateMessage from "../services/WABAMeta/SendWabaMetaTemplateMessage";

export const listTemplates = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { tenantId } = req.user;
  const { whatsappId } = req.params;

  const channel = await ShowWhatsAppService({
    id: whatsappId,
    tenantId,
    isInternal: true
  });

  const templates = await GetMetaMessageTemplates(channel);
  return res.status(200).json(templates);
};

export const sendTemplate = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { tenantId } = req.user;
  const { whatsappId } = req.params;
  const { to, templateName, languageCode, components } = req.body;

  const message = await SendWabaMetaTemplateMessage({
    whatsappId: Number(whatsappId),
    tenantId,
    to,
    templateName,
    languageCode,
    components
  });

  return res.status(200).json(message);
};
