import { CookieOptions } from "express";

const isProduction = process.env.NODE_ENV === "production";

export const getRefreshTokenCookieOptions = (): CookieOptions => ({
  httpOnly: true,
  sameSite: isProduction ? "none" : "lax",
  secure: isProduction,
  maxAge: 7 * 24 * 60 * 60 * 1000
});

export const getClearRefreshTokenCookieOptions = (): CookieOptions => {
  const options = getRefreshTokenCookieOptions();
  delete options.maxAge;
  return options;
};
