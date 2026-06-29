import axios from "axios";
import { sign, verify } from "jsonwebtoken";
import { Op } from "sequelize";
import authConfig from "../../config/auth";
import AppError from "../../errors/AppError";
import { getIO } from "../../libs/socket";
import Whatsapp from "../../models/Whatsapp";
import {
  getWabaMetaGraphBaseUrl,
  getWabaMetaOAuthConfig
} from "./WabaMetaOAuthConfig";

interface WabaMetaOAuthState {
  purpose: string;
  tenantId: number;
  userId: number;
}

interface WabaPhoneNumber {
  id: string;
  // eslint-disable-next-line camelcase
  display_phone_number?: string;
  // eslint-disable-next-line camelcase
  verified_name?: string;
}

interface WabaAccount {
  id: string;
  name?: string;
  // eslint-disable-next-line camelcase
  phone_numbers?: {
    data?: WabaPhoneNumber[];
  };
}

const scopes = [
  "business_management",
  "whatsapp_business_management",
  "whatsapp_business_messaging"
].join(",");

export const getWabaMetaEmbeddedSignupUrl = ({
  tenantId,
  userId
}: {
  tenantId: number;
  userId: number;
}): string => {
  const { appId, redirectUri, graphApiVersion, embeddedSignupConfigId } =
    getWabaMetaOAuthConfig();
  const state = sign(
    {
      purpose: "waba-meta-oauth",
      tenantId,
      userId
    },
    authConfig.secret,
    { expiresIn: "15m" }
  );
  const query = new URLSearchParams({
    client_id: appId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: scopes,
    state
  });

  if (embeddedSignupConfigId) {
    query.set("config_id", embeddedSignupConfigId);
  }

  return `https://www.facebook.com/${graphApiVersion}/dialog/oauth?${query.toString()}`;
};

const exchangeCodeForLongLivedToken = async (code: string): Promise<string> => {
  const { appId, appSecret, redirectUri } = getWabaMetaOAuthConfig();
  const graphBaseUrl = getWabaMetaGraphBaseUrl();

  const shortResponse = await axios.get(`${graphBaseUrl}/oauth/access_token`, {
    params: {
      client_id: appId,
      client_secret: appSecret,
      redirect_uri: redirectUri,
      code
    }
  });
  const shortToken = shortResponse.data.access_token;
  if (!shortToken) {
    throw new AppError("ERR_META_WHATSAPP_OAUTH_TOKEN", 502);
  }

  const longResponse = await axios.get(`${graphBaseUrl}/oauth/access_token`, {
    params: {
      grant_type: "fb_exchange_token",
      client_id: appId,
      client_secret: appSecret,
      fb_exchange_token: shortToken
    }
  });

  return longResponse.data.access_token || shortToken;
};

const getFirstAuthorizedPhoneNumber = async (
  accessToken: string
): Promise<{ account: WabaAccount; phone: WabaPhoneNumber }> => {
  const graphBaseUrl = getWabaMetaGraphBaseUrl();
  const response = await axios.get(`${graphBaseUrl}/me`, {
    params: {
      fields:
        "businesses{owned_whatsapp_business_accounts{id,name,phone_numbers{id,display_phone_number,verified_name}}}",
      access_token: accessToken
    }
  });

  const businesses = response.data?.businesses?.data || [];
  const accounts: WabaAccount[] = businesses.flatMap(
    (business: LegacyAny) =>
      business.owned_whatsapp_business_accounts?.data || []
  );
  const account = accounts.find(item => item.phone_numbers?.data?.length);
  const phone = account?.phone_numbers?.data?.[0];

  if (!account || !phone?.id) {
    throw new AppError("ERR_META_WHATSAPP_PHONE_NOT_FOUND", 404);
  }

  return { account, phone };
};

export const connectWabaMetaChannel = async (
  code: string,
  state: string
): Promise<Whatsapp> => {
  const payload = verify(state, authConfig.secret) as WabaMetaOAuthState;
  if (payload.purpose !== "waba-meta-oauth") {
    throw new AppError("ERR_META_WHATSAPP_INVALID_STATE", 403);
  }

  const accessToken = await exchangeCodeForLongLivedToken(code);
  const { account, phone } = await getFirstAuthorizedPhoneNumber(accessToken);
  const displayNumber = phone.display_phone_number || "";
  const baseChannelName =
    phone.verified_name || displayNumber || account.name || "WhatsApp Oficial";
  const channelName = `${baseChannelName} - ${payload.tenantId}`;

  const existingChannel = await Whatsapp.findOne({
    where: {
      tenantId: payload.tenantId,
      type: "waba",
      wabaBSP: "meta",
      fbPageId: phone.id,
      isDeleted: false
    }
  });

  const defaultChannel = await Whatsapp.findOne({
    where: {
      tenantId: payload.tenantId,
      isDefault: true,
      ...(existingChannel
        ? {
            id: { [Op.not]: existingChannel.id }
          }
        : {})
    }
  });

  const channelPayload = {
    name: channelName,
    status: "DISCONNECTED",
    isDefault: !defaultChannel,
    tenantId: payload.tenantId,
    type: "waba",
    wabaBSP: "meta",
    tokenAPI: accessToken,
    fbPageId: phone.id,
    number: displayNumber,
    fbObject: {
      wabaId: account.id,
      wabaName: account.name,
      phoneNumberId: phone.id,
      displayPhoneNumber: displayNumber,
      verifiedName: phone.verified_name
    }
  };

  const channel = existingChannel
    ? await existingChannel.update(channelPayload)
    : await Whatsapp.create(channelPayload);

  getIO().emit(`${channel.tenantId}:whatsapp`, {
    action: "update",
    whatsapp: channel
  });

  return channel;
};
