export const emailMock = {
  send: jest.fn(async () => ({
    id: "email_test_123",
    accepted: ["cliente@example.test"]
  }))
};
