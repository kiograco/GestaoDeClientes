import { createHmac } from "crypto";
import {
  CheckServiceWabaMeta,
  ReceivedRequestWabaMeta
} from "../../../src/controllers/WebHooksController";
import AppError from "../../../src/errors/AppError";
import Whatsapp from "../../../src/models/Whatsapp";
import HandleMessage360 from "../../../src/services/WABA360/HandleMessage360";
import HandleWabaMetaStatus from "../../../src/services/WABAMeta/HandleWabaMetaStatus";

jest.mock("../../../src/models/Whatsapp", () => ({
  __esModule: true,
  default: { findOne: jest.fn() }
}));

jest.mock("../../../src/services/WABA360/HandleMessage360", () =>
  jest.fn().mockResolvedValue(undefined)
);

jest.mock("../../../src/services/WABAMeta/HandleWabaMetaStatus", () =>
  jest.fn().mockResolvedValue(undefined)
);

const buildRes = () => {
  const res: LegacyAny = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  return res;
};

describe("WebHooksController - Meta", () => {
  const appSecret = "app-secret";

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.META_APP_SECRET = appSecret;
  });

  describe("CheckServiceWabaMeta", () => {
    it("retorna o challenge quando o modo e o token sao validos", async () => {
      (Whatsapp.findOne as jest.Mock).mockResolvedValue({ id: 1 });
      const req: LegacyAny = {
        query: {
          "hub.mode": "subscribe",
          "hub.verify_token": "tok",
          "hub.challenge": "challenge-value"
        },
        params: { token: "tok" }
      };
      const res = buildRes();

      await CheckServiceWabaMeta(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith("challenge-value");
    });

    it("rejeita quando o verify token nao bate", async () => {
      const req: LegacyAny = {
        query: {
          "hub.mode": "subscribe",
          "hub.verify_token": "errado",
          "hub.challenge": "challenge-value"
        },
        params: { token: "tok" }
      };
      const res = buildRes();

      await CheckServiceWabaMeta(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(Whatsapp.findOne).not.toHaveBeenCalled();
    });
  });

  describe("ReceivedRequestWabaMeta", () => {
    const sign = (rawBody: Buffer): string =>
      `sha256=${createHmac("sha256", appSecret).update(rawBody).digest("hex")}`;

    it("rejeita payload sem assinatura valida", async () => {
      const rawBody = Buffer.from(JSON.stringify({ entry: [] }));
      const req: LegacyAny = {
        header: jest.fn(() => "sha256=invalido"),
        rawBody,
        params: { token: "tok" },
        body: { entry: [] }
      };
      const res = buildRes();

      await expect(ReceivedRequestWabaMeta(req, res)).rejects.toBeInstanceOf(
        AppError
      );
    });

    it("processa mensagens recebidas com assinatura valida", async () => {
      const payload = {
        entry: [
          {
            changes: [
              {
                value: {
                  contacts: [
                    { profile: { name: "Fulano" }, wa_id: "5511999999999" }
                  ],
                  messages: [
                    { id: "wamid.1", type: "text", text: { body: "oi" } }
                  ]
                }
              }
            ]
          }
        ]
      };
      const rawBody = Buffer.from(JSON.stringify(payload));
      (Whatsapp.findOne as jest.Mock).mockResolvedValue({ id: 10 });

      const req: LegacyAny = {
        header: jest.fn(() => sign(rawBody)),
        rawBody,
        params: { token: "tok" },
        body: payload
      };
      const res = buildRes();

      await ReceivedRequestWabaMeta(req, res);

      expect(HandleMessage360).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: payload.entry[0].changes[0].value.messages
        }),
        10
      );
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("processa status de entrega/leitura sem exigir mensagens", async () => {
      const payload = {
        entry: [
          {
            changes: [
              {
                value: {
                  statuses: [{ id: "wamid.2", status: "delivered" }]
                }
              }
            ]
          }
        ]
      };
      const rawBody = Buffer.from(JSON.stringify(payload));
      (Whatsapp.findOne as jest.Mock).mockResolvedValue({ id: 10 });

      const req: LegacyAny = {
        header: jest.fn(() => sign(rawBody)),
        rawBody,
        params: { token: "tok" },
        body: payload
      };
      const res = buildRes();

      await ReceivedRequestWabaMeta(req, res);

      expect(HandleWabaMetaStatus).toHaveBeenCalledWith(
        payload.entry[0].changes[0].value.statuses
      );
      expect(HandleMessage360).not.toHaveBeenCalled();
    });
  });
});
