export const chatbotMock = {
  classifyIntent: jest.fn(async () => "ADD_TO_CART"),
  buildCart: jest.fn(items => ({ items, status: "OPEN" }))
};
