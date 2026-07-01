import HandleWabaMetaStatus from "../../../src/services/WABAMeta/HandleWabaMetaStatus";
import Message from "../../../src/models/Message";

jest.mock("../../../src/models/Message", () => ({
  __esModule: true,
  default: {
    findOne: jest.fn()
  }
}));

describe("HandleWabaMetaStatus", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("atualiza o ack da mensagem para delivered", async () => {
    const update = jest.fn();
    (Message.findOne as jest.Mock).mockResolvedValue({
      ack: 1,
      ticket: { id: 1, tenantId: 7 },
      update
    });

    await HandleWabaMetaStatus([
      { id: "wamid.1", status: "delivered" }
    ] as LegacyAny);

    expect(update).toHaveBeenCalledWith({ ack: 2 });
  });

  it("atualiza o ack da mensagem para read", async () => {
    const update = jest.fn();
    (Message.findOne as jest.Mock).mockResolvedValue({
      ack: 2,
      ticket: { id: 1, tenantId: 7 },
      update
    });

    await HandleWabaMetaStatus([
      { id: "wamid.2", status: "read" }
    ] as LegacyAny);

    expect(update).toHaveBeenCalledWith({ ack: 3 });
  });

  it("marca a mensagem como falha mesmo se o ack atual for maior", async () => {
    const update = jest.fn();
    (Message.findOne as jest.Mock).mockResolvedValue({
      ack: 2,
      ticket: { id: 1, tenantId: 7 },
      update
    });

    await HandleWabaMetaStatus([
      { id: "wamid.3", status: "failed", errors: [{ code: 131, message: "x" }] }
    ] as LegacyAny);

    expect(update).toHaveBeenCalledWith({ ack: -1 });
  });

  it("ignora status desconhecido", async () => {
    await HandleWabaMetaStatus([
      { id: "wamid.4", status: "unknown" }
    ] as LegacyAny);

    expect(Message.findOne).not.toHaveBeenCalled();
  });

  it("nao falha quando a mensagem nao e encontrada", async () => {
    (Message.findOne as jest.Mock).mockResolvedValue(null);

    await expect(
      HandleWabaMetaStatus([{ id: "wamid.5", status: "sent" }] as LegacyAny)
    ).resolves.toBeUndefined();
  });
});
