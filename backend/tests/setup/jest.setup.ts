process.env.NODE_ENV = "test";
process.env.DB_DIALECT = process.env.DB_DIALECT || "postgres";
process.env.POSTGRES_HOST = process.env.POSTGRES_HOST || "localhost";
process.env.POSTGRES_DB = process.env.POSTGRES_DB || "wchats_test";
process.env.POSTGRES_USER = process.env.POSTGRES_USER || "postgres";
process.env.POSTGRES_PASSWORD = process.env.POSTGRES_PASSWORD || "postgres";
process.env.DB_PORT = process.env.DB_PORT || "5432";
process.env.POSTGRES_POOL_MIN = process.env.POSTGRES_POOL_MIN || "0";
process.env.POSTGRES_POOL_MAX = process.env.POSTGRES_POOL_MAX || "5";
process.env.POSTGRES_POOL_ACQUIRE =
  process.env.POSTGRES_POOL_ACQUIRE || "10000";
process.env.JWT_SECRET = process.env.JWT_SECRET || "test-jwt-secret";
process.env.JWT_REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET || "test-refresh-secret";
process.env.FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:8080";

jest.setTimeout(30000);

jest.mock("../../src/libs/socket", () => ({
  getIO: () => ({
    emit: jest.fn(),
    to: jest.fn(() => ({
      emit: jest.fn()
    }))
  }),
  initIO: jest.fn()
}));

jest.mock("../../src/libs/Queue", () => ({
  __esModule: true,
  default: {
    add: jest.fn(),
    process: jest.fn()
  }
}));

jest.mock("whatsapp-web.js", () => ({
  Client: jest.fn(),
  DefaultOptions: { userAgent: "jest" },
  LocalAuth: jest.fn(),
  MessageMedia: {
    fromFilePath: jest.fn()
  }
}));

jest.mock("qrcode-terminal", () => ({
  generate: jest.fn()
}));

jest.mock("instagram-private-api", () => ({
  IgApiClient: jest.fn()
}));

jest.mock("telegraf", () => ({
  Telegraf: jest.fn()
}));

jest.mock("sharp", () => {
  const sharp = jest.fn(() => ({
    resize: jest.fn().mockReturnThis(),
    jpeg: jest.fn().mockReturnThis(),
    png: jest.fn().mockReturnThis(),
    webp: jest.fn().mockReturnThis(),
    toBuffer: jest.fn(async () => Buffer.from("test-image")),
    toFile: jest.fn(async () => ({ size: 1 }))
  }));
  return sharp;
});
