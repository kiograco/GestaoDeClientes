import AppError from "../../errors/AppError";

type WabaMetaOAuthConfig = {
  appId: string;
  appSecret: string;
  redirectUri: string;
  graphApiVersion: string;
  embeddedSignupConfigId?: string;
};

export const getWabaMetaOAuthConfig = (): WabaMetaOAuthConfig => {
  const appId = process.env.META_APP_ID || process.env.VUE_FACEBOOK_APP_ID;
  const appSecret =
    process.env.META_APP_SECRET || process.env.FACEBOOK_APP_SECRET;
  const redirectUri = process.env.META_WHATSAPP_REDIRECT_URI;
  const graphApiVersion = process.env.META_GRAPH_API_VERSION || "v20.0";
  const embeddedSignupConfigId =
    process.env.META_WHATSAPP_EMBEDDED_SIGNUP_CONFIG_ID;

  if (!appId || !appSecret || !redirectUri) {
    throw new AppError("ERR_META_WHATSAPP_OAUTH_NOT_CONFIGURED", 503);
  }

  return {
    appId,
    appSecret,
    redirectUri,
    graphApiVersion,
    embeddedSignupConfigId
  };
};

export const getWabaMetaGraphBaseUrl = (): string => {
  const { graphApiVersion } = getWabaMetaOAuthConfig();
  return `https://graph.facebook.com/${graphApiVersion}`;
};
