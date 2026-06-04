export const paymentGatewayMock = {
  createCustomer: jest.fn(async () => ({ id: "cus_test_123" })),
  createPayment: jest.fn(async () => ({
    id: "pay_test_123",
    status: "PENDING",
    invoiceUrl: "https://payments.example.test/invoice/pay_test_123"
  })),
  verifyWebhookSignature: jest.fn(() => true)
};
