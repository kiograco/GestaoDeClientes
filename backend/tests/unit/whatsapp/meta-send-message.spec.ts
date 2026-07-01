import SentMessageMeta from "../../../src/services/WABAMeta/SentMessageMeta";
import AppError from "../../../src/errors/AppError";
import { metaGraphBreaker } from "../../../src/services/WABAMeta/metaGraphClient";

jest.mock("../../../src/services/WABAMeta/metaGraphClient", () => ({
  metaGraphBreaker: { fire: jest.fn() }
}));

describe("SentMessageMeta", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("envia a mensagem e retorna o wamid retornado pela Graph API", async () => {
    (metaGraphBreaker.fire as jest.Mock).mockResolvedValue({
      data: { messages: [{ id: "wamid.123" }] }
    });

    const result = await SentMessageMeta({
      message: { to: "5511999999999", type: "text", text: { body: "oi" } },
      accessToken: "token",
      phoneNumberId: "123456"
    });

    expect(result).toEqual({ messages: [{ id: "wamid.123" }] });
    expect(metaGraphBreaker.fire).toHaveBeenCalledWith(
      expect.objectContaining({
        method: "post",
        url: expect.stringContaining("/123456/messages"),
        data: expect.objectContaining({
          messaging_product: "whatsapp",
          to: "5511999999999"
        }),
        headers: expect.objectContaining({
          Authorization: "Bearer token"
        })
      })
    );
  });

  it("propaga falha nao retentavel (ex.: token invalido) como AppError", async () => {
    (metaGraphBreaker.fire as jest.Mock).mockRejectedValue({
      response: { status: 401, headers: {} }
    });

    await expect(
      SentMessageMeta({
        message: { to: "5511999999999", type: "text", text: { body: "oi" } },
        accessToken: "token-invalido",
        phoneNumberId: "123456"
      })
    ).rejects.toBeInstanceOf(AppError);

    expect(metaGraphBreaker.fire).toHaveBeenCalledTimes(1);
  });
});
