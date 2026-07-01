import AppError from "../../../src/errors/AppError";
import Whatsapp from "../../../src/models/Whatsapp";
import CreateWhatsAppService from "../../../src/services/WhatsappService/CreateWhatsAppService";
import ListWhatsAppsService from "../../../src/services/WhatsappService/ListWhatsAppsService";

jest.mock("../../../src/models/Whatsapp", () => ({
  __esModule: true,
  default: {
    findOne: jest.fn(),
    findAll: jest.fn(),
    create: jest.fn()
  }
}));

jest.mock("../../../src/libs/socket", () => ({
  getIO: jest.fn(() => ({
    emit: jest.fn()
  }))
}));

describe("whatsapp meta-only connections", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("rejeita criacao de conexao legada", async () => {
    await expect(
      CreateWhatsAppService({
        name: "Canal legado",
        tenantId: 1,
        type: "telegram",
        wabaBSP: "meta",
        tokenAPI: "token",
        fbPageId: "123"
      })
    ).rejects.toMatchObject<AppError>({
      message: "ERR_ONLY_META_WHATSAPP_SUPPORTED",
      statusCode: 400
    });

    expect(Whatsapp.create).not.toHaveBeenCalled();
  });

  it("cria conexao apenas como waba/meta", async () => {
    const channel = { id: 10, tenantId: 1, type: "waba", wabaBSP: "meta" };
    (Whatsapp.findOne as jest.Mock).mockResolvedValue(null);
    (Whatsapp.create as jest.Mock).mockResolvedValue(channel);

    const result = await CreateWhatsAppService({
      name: "Meta oficial",
      tenantId: 1,
      type: "waba",
      wabaBSP: "meta",
      tokenAPI: "token",
      fbPageId: "123456789"
    });

    expect(Whatsapp.create).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "waba",
        wabaBSP: "meta",
        tokenAPI: "token",
        fbPageId: "123456789"
      })
    );
    expect(result.whatsapp).toBe(channel);
  });

  it("lista somente conexoes waba/meta do tenant", async () => {
    (Whatsapp.findAll as jest.Mock).mockResolvedValue([]);

    await ListWhatsAppsService(7);

    expect(Whatsapp.findAll).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          tenantId: 7,
          type: "waba",
          wabaBSP: "meta"
        }
      })
    );
  });
});
