import AppError from "../../../src/errors/AppError";
import SendWabaMetaQuickReplyButtons from "../../../src/services/WABAMeta/SendWabaMetaInteractive";
import { metaGraphBreaker } from "../../../src/services/WABAMeta/metaGraphClient";
import ShowWhatsAppService from "../../../src/services/WhatsappService/ShowWhatsAppService";

jest.mock("../../../src/services/WABAMeta/metaGraphClient", () => ({
  metaGraphBreaker: { fire: jest.fn() }
}));

jest.mock("../../../src/services/WhatsappService/ShowWhatsAppService");

describe("SendWabaMetaQuickReplyButtons", () => {
  beforeEach(() => jest.clearAllMocks());

  it("envia mensagem interativa com os botoes informados", async () => {
    (ShowWhatsAppService as jest.Mock).mockResolvedValue({
      id: 1,
      wabaBSP: "meta",
      type: "waba",
      tokenAPI: "token",
      fbPageId: "123456"
    });
    (metaGraphBreaker.fire as jest.Mock).mockResolvedValue({
      data: { messages: [{ id: "wamid.btn.1" }] }
    });

    const result = await SendWabaMetaQuickReplyButtons({
      whatsappId: 1,
      tenantId: 7,
      to: "5511999999999",
      bodyText: "Escolha uma opcao",
      buttons: [{ id: "op1", title: "Opção 1" }]
    });

    expect(result).toEqual({ messages: [{ id: "wamid.btn.1" }] });
    expect(metaGraphBreaker.fire).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          type: "interactive",
          interactive: expect.objectContaining({ type: "button" })
        })
      })
    );
  });

  it("rejeita quando ha mais de 3 botoes", async () => {
    await expect(
      SendWabaMetaQuickReplyButtons({
        whatsappId: 1,
        tenantId: 7,
        to: "5511999999999",
        bodyText: "Escolha uma opcao",
        buttons: [
          { id: "1", title: "A" },
          { id: "2", title: "B" },
          { id: "3", title: "C" },
          { id: "4", title: "D" }
        ]
      })
    ).rejects.toBeInstanceOf(AppError);
    expect(ShowWhatsAppService).not.toHaveBeenCalled();
  });
});
