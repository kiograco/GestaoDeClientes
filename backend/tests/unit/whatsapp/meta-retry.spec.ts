import { withMetaRetry } from "../../../src/services/WABAMeta/metaRetry";

const buildError = (status: number, headers: Record<string, string> = {}) => ({
  response: { status, headers }
});

describe("withMetaRetry", () => {
  it("retorna o resultado de primeira sem retentar em caso de sucesso", async () => {
    const action = jest.fn().mockResolvedValue("ok");

    const result = await withMetaRetry(action, { baseDelayMs: 1 });

    expect(result).toBe("ok");
    expect(action).toHaveBeenCalledTimes(1);
  });

  it("retenta em erro 429 e depois retorna sucesso", async () => {
    const action = jest
      .fn()
      .mockRejectedValueOnce(buildError(429))
      .mockResolvedValueOnce("ok-after-retry");

    const result = await withMetaRetry(action, {
      baseDelayMs: 1,
      maxRetries: 2
    });

    expect(result).toBe("ok-after-retry");
    expect(action).toHaveBeenCalledTimes(2);
  });

  it("respeita o header Retry-After quando informado", async () => {
    const action = jest
      .fn()
      .mockRejectedValueOnce(buildError(429, { "retry-after": "0" }))
      .mockResolvedValueOnce("ok");

    const result = await withMetaRetry(action, { maxRetries: 1 });

    expect(result).toBe("ok");
    expect(action).toHaveBeenCalledTimes(2);
  });

  it("nao retenta erros nao retentaveis (ex.: 400)", async () => {
    const error = buildError(400);
    const action = jest.fn().mockRejectedValue(error);

    await expect(
      withMetaRetry(action, { baseDelayMs: 1, maxRetries: 3 })
    ).rejects.toBe(error);
    expect(action).toHaveBeenCalledTimes(1);
  });

  it("desiste apos exceder o numero maximo de tentativas", async () => {
    const error = buildError(500);
    const action = jest.fn().mockRejectedValue(error);

    await expect(
      withMetaRetry(action, { baseDelayMs: 1, maxRetries: 2 })
    ).rejects.toBe(error);
    expect(action).toHaveBeenCalledTimes(3);
  });
});
