import AppError from "../../errors/AppError";

type InstagramOAuthConfig = {
  appId: string;
  appSecret: string;
  redirectUri: string;
  verifyToken: string;
};

export const getInstagramOAuthConfig = (): InstagramOAuthConfig => {
  const appId = process.env.INSTAGRAM_APP_ID;
  const appSecret = process.env.INSTAGRAM_APP_SECRET;
  const redirectUri = process.env.INSTAGRAM_REDIRECT_URI;
  const verifyToken = process.env.INSTAGRAM_WEBHOOK_VERIFY_TOKEN;

  if (!appId || !appSecret || !redirectUri || !verifyToken) {
    throw new AppError("ERR_INSTAGRAM_OAUTH_NOT_CONFIGURED", 503);
  }

  return { appId, appSecret, redirectUri, verifyToken };
};

export const instagramGraphUrl =
  process.env.INSTAGRAM_GRAPH_URL || "https://graph.instagram.com";
