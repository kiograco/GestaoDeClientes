import { Response } from "express";
import { getRefreshTokenCookieOptions } from "./RefreshTokenCookie";

export const SendRefreshToken = (res: Response, token: string): void => {
  res.cookie("jrt", token, getRefreshTokenCookieOptions());
};
