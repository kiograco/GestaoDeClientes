const DEFAULT_FRONTEND_URL = "http://localhost:8080";

export const getFrontendOrigins = (): string[] => {
  const raw = process.env.FRONTEND_URL || DEFAULT_FRONTEND_URL;
  return raw
    .split(",")
    .map(value => value.trim())
    .filter(Boolean);
};

export const getPrimaryFrontendUrl = (): string => {
  const [primary] = getFrontendOrigins();
  return (primary || DEFAULT_FRONTEND_URL).replace(/\/$/, "");
};
