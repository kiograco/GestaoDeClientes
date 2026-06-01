import { Request, Response } from "express";
import { getIO } from "../libs/socket";
import AdminListChatFlowService from "../services/AdminServices/AdminListChatFlowService";
import AdminListSettingsService from "../services/AdminServices/AdminListSettingsService";
import AdminListTenantsService from "../services/AdminServices/AdminListTenantsService";
import AdminListUsersService from "../services/AdminServices/AdminListUsersService";
import AdminListChannelsService from "../services/AdminServices/AdminListChannelsService";
import AdminUpdateUserService from "../services/AdminServices/AdminUpdateUserService";
import UpdateSettingService from "../services/SettingServices/UpdateSettingService";
import CreateWhatsAppService from "../services/WhatsappService/CreateWhatsAppService";
import AdminCreateTenantService from "../services/AdminServices/AdminCreateTenantService";
import AdminUpdateTenantService from "../services/AdminServices/AdminUpdateTenantService";

type IndexQuery = {
  searchParam: string;
  pageNumber: string;
};

type IndexQuerySettings = {
  tenantId?: string | number;
};

interface ChannelData {
  name: string;
  status?: string;
  isActive?: string;
  tokenTelegram?: string;
  instagramUser?: string;
  instagramKey?: string;
  type: "waba" | "instagram" | "telegram" | "whatsapp";
  wabaBSP?: string;
  tokenAPI?: string;
  tenantId: string | number;
}

export const indexUsers = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { searchParam, pageNumber } = req.query as IndexQuery;
  const { users, count, hasMore } = await AdminListUsersService({
    searchParam,
    pageNumber
  });
  return res.status(200).json({ users, count, hasMore });
};

export const updateUser = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const userData = req.body;
  const { userId } = req.params;

  const user = await AdminUpdateUserService({ userData, userId });

  const io = getIO();
  if (user) {
    io.emit(`${user.tenantId}:user`, {
      action: "update",
      user
    });
  }

  return res.status(200).json(user);
};

export const indexTenants = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const tenants = await AdminListTenantsService();
  return res.status(200).json(tenants);
};

export const storeTenant = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const tenant = await AdminCreateTenantService(req.body);
  return res.status(201).json(tenant);
};

export const updateTenant = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { tenantId } = req.params;
  const { status, paidDays } = req.body;
  const tenant = await AdminUpdateTenantService({ tenantId, status, paidDays });
  if (tenant.status === "inactive") {
    const room = getIO().in(String(tenant.id)) as unknown as {
      disconnectSockets: (close?: boolean) => void;
    };
    room.disconnectSockets(true);
  }
  return res.status(200).json(tenant);
};

export const indexChatFlow = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { tenantId } = req.params;
  const chatFlow = await AdminListChatFlowService({ tenantId });
  return res.status(200).json(chatFlow);
};

export const indexSettings = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { tenantId } = req.params as IndexQuerySettings;
  const settings = await AdminListSettingsService(tenantId);

  return res.status(200).json(settings);
};

export const updateSettings = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { tenantId } = req.params;
  const { value, key } = req.body;

  const setting = await UpdateSettingService({
    key,
    value,
    tenantId
  });

  const io = getIO();
  io.emit(`${tenantId}:settings`, {
    action: "update",
    setting
  });

  return res.status(200).json(setting);
};

export const indexChannels = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { tenantId } = req.query as LegacyAny;
  const channels = await AdminListChannelsService({ tenantId });
  return res.status(200).json(channels);
};

export const storeChannel = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const {
    name,
    tenantId,
    tokenTelegram,
    instagramUser,
    instagramKey,
    type,
    wabaBSP,
    tokenAPI
  } = req.body;

  const data: ChannelData = {
    name,
    status: "DISCONNECTED",
    tenantId,
    tokenTelegram,
    instagramUser,
    instagramKey,
    type,
    wabaBSP,
    tokenAPI
  };

  const channels = await CreateWhatsAppService(data);
  return res.status(200).json(channels);
};
