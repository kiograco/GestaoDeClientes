import AppError from "../../../src/errors/AppError";
import GetMetaMessageTemplates from "../../../src/services/WABAMeta/GetMetaMessageTemplates";
import SendWabaMetaTemplateMessage from "../../../src/services/WABAMeta/SendWabaMetaTemplateMessage";
import { metaGraphBreaker } from "../../../src/services/WABAMeta/metaGraphClient";
import ShowWhatsAppService from "../../../src/services/WhatsappService/ShowWhatsAppService";
import CreateOrUpdateContactService from "../../../src/services/ContactServices/CreateOrUpdateContactService";
import FindOrCreateTicketService from "../../../src/services/TicketServices/FindOrCreateTicketService";
import CreateMessageService from "../../../src/services/MessageServices/CreateMessageService";

jest.mock("../../../src/services/WABAMeta/metaGraphClient", () => ({
  metaGraphBreaker: { fire: jest.fn() }
}));

jest.mock("../../../src/services/WhatsappService/ShowWhatsAppService");
jest.mock("../../../src/services/ContactServices/CreateOrUpdateContactService");
jest.mock("../../../src/services/TicketServices/FindOrCreateTicketService");
jest.mock("../../../src/services/MessageServices/CreateMessageService");

describe("GetMetaMessageTemplates", () => {
  beforeEach(() => jest.clearAllMocks());

  it("lista os templates usando o wabaId salvo em fbObject", async () => {
    (metaGraphBreaker.fire as jest.Mock).mockResolvedValue({
      data: { data: [{ name: "boas_vindas", status: "APPROVED" }] }
    });

    const channel: LegacyAny = {
      tokenAPI: "token",
      fbObject: { wabaId: "waba-1" }
    };

    const templates = await GetMetaMessageTemplates(channel);

    expect(templates).toEqual([{ name: "boas_vindas", status: "APPROVED" }]);
    expect(metaGraphBreaker.fire).toHaveBeenCalledWith(
      expect.objectContaining({
        url: expect.stringContaining("/waba-1/message_templates")
      })
    );
  });

  it("lanca erro quando o canal nao tem wabaId configurado", async () => {
    const channel: LegacyAny = { tokenAPI: "token", fbObject: null };

    await expect(GetMetaMessageTemplates(channel)).rejects.toBeInstanceOf(
      AppError
    );
    expect(metaGraphBreaker.fire).not.toHaveBeenCalled();
  });
});

describe("SendWabaMetaTemplateMessage", () => {
  beforeEach(() => jest.clearAllMocks());

  it("envia o template e cria contato/ticket/mensagem no CRM", async () => {
    (ShowWhatsAppService as jest.Mock).mockResolvedValue({
      id: 1,
      tenantId: 7,
      wabaBSP: "meta",
      type: "waba",
      tokenAPI: "token",
      fbPageId: "123456"
    });
    (metaGraphBreaker.fire as jest.Mock).mockResolvedValue({
      data: { messages: [{ id: "wamid.template.1" }] }
    });
    (CreateOrUpdateContactService as jest.Mock).mockResolvedValue({ id: 55 });
    (FindOrCreateTicketService as jest.Mock).mockResolvedValue({ id: 99 });
    (CreateMessageService as jest.Mock).mockResolvedValue({ id: "msg-1" });

    const result = await SendWabaMetaTemplateMessage({
      whatsappId: 1,
      tenantId: 7,
      to: "+55 11 99999-9999",
      templateName: "boas_vindas",
      languageCode: "pt_BR"
    });

    expect(result).toEqual({ id: "msg-1" });
    expect(metaGraphBreaker.fire).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          to: "5511999999999",
          type: "template",
          template: expect.objectContaining({
            name: "boas_vindas",
            language: { code: "pt_BR" }
          })
        })
      })
    );
    expect(FindOrCreateTicketService).toHaveBeenCalledWith(
      expect.objectContaining({ whatsappId: 1, tenantId: 7, channel: "waba" })
    );
    expect(CreateMessageService).toHaveBeenCalledWith(
      expect.objectContaining({
        messageData: expect.objectContaining({
          messageId: "wamid.template.1",
          ticketId: 99,
          fromMe: true
        })
      })
    );
  });

  it("rejeita canais que nao sejam waba/meta", async () => {
    (ShowWhatsAppService as jest.Mock).mockResolvedValue({
      id: 2,
      tenantId: 7,
      wabaBSP: "360",
      type: "waba"
    });

    await expect(
      SendWabaMetaTemplateMessage({
        whatsappId: 2,
        tenantId: 7,
        to: "5511999999999",
        templateName: "boas_vindas",
        languageCode: "pt_BR"
      })
    ).rejects.toBeInstanceOf(AppError);
    expect(metaGraphBreaker.fire).not.toHaveBeenCalled();
  });
});
