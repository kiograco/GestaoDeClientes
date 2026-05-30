import axios from "axios";
import { sign, verify } from "jsonwebtoken";
import authConfig from "../../config/auth";
import AppError from "../../errors/AppError";
import Whatsapp from "../../models/Whatsapp";
import { getIO } from "../../libs/socket";
import {
  getInstagramOAuthConfig,
  instagramGraphUrl
} from "./InstagramOAuthConfig";

interface OAuthState {
  purpose: string;
  channelId: number;
  tenantId: number;
}

const scopes = [
  "instagram_business_basic",
  "instagram_business_manage_messages"
].join(",");

export const getInstagramAuthorizationUrl = (channel: Whatsapp): string => {
  const { appId, redirectUri } = getInstagramOAuthConfig();
  const state = sign(
    {
      purpose: "instagram-oauth",
      channelId: channel.id,
      tenantId: channel.tenantId
    },
    authConfig.secret,
    { expiresIn: "10m" }
  );
  const query = new URLSearchParams({
    client_id: appId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: scopes,
    state
  });
  return `https://www.instagram.com/oauth/authorize?${query.toString()}`;
};

export const connectInstagramOAuthChannel = async (
  code: string,
  state: string
): Promise<Whatsapp> => {
  const { appId, appSecret, redirectUri } = getInstagramOAuthConfig();
  const payload = verify(state, authConfig.secret) as OAuthState;
  if (payload.purpose !== "instagram-oauth") {
    throw new AppError("ERR_INSTAGRAM_OAUTH_INVALID_STATE", 403);
  }

  const channel = await Whatsapp.findOne({
    where: {
      id: payload.channelId,
      tenantId: payload.tenantId,
      type: "instagram_oauth"
    }
  });
  if (!channel) {
    throw new AppError("ERR_NO_WAPP_FOUND", 404);
  }

  const form = new URLSearchParams({
    client_id: appId,
    client_secret: appSecret,
    grant_type: "authorization_code",
    redirect_uri: redirectUri,
    code
  });
  const shortResponse = await axios.post(
    "https://api.instagram.com/oauth/access_token",
    form.toString(),
    { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
  );
  const shortToken = shortResponse.data.access_token;
  const userId = String(shortResponse.data.user_id);
  if (!shortToken || !userId) {
    throw new AppError("ERR_INSTAGRAM_OAUTH_TOKEN", 502);
  }

  const longResponse = await axios.get(`${instagramGraphUrl}/access_token`, {
    params: {
      grant_type: "ig_exchange_token",
      client_secret: appSecret,
      access_token: shortToken
    }
  });
  const token = longResponse.data.access_token;
  const expiresIn = Number(longResponse.data.expires_in || 5184000);

  const profileResponse = await axios.get(`${instagramGraphUrl}/me`, {
    params: { fields: "id,user_id,username", access_token: token }
  });
  const instagramOAuthUserId = String(profileResponse.data.user_id || userId);
  const instagramUser = profileResponse.data.username || channel.name;

  await axios.post(
    `${instagramGraphUrl}/${instagramOAuthUserId}/subscribed_apps`,
    null,
    {
      params: {
        subscribed_fields: "messages,messaging_postbacks,messaging_seen",
        access_token: token
      }
    }
  );

  await channel.update({
    instagramOAuthUserId,
    instagramOAuthToken: token,
    instagramOAuthExpiresAt: new Date(Date.now() + expiresIn * 1000),
    instagramUser,
    status: "CONNECTED"
  });

  getIO().emit(`${channel.tenantId}:whatsappSession`, {
    action: "update",
    session: {
      id: channel.id,
      name: channel.name,
      status: channel.status,
      type: channel.type,
      instagramUser: channel.instagramUser,
      tenantId: channel.tenantId,
      updatedAt: channel.updatedAt
    }
  });
  return channel;
};
