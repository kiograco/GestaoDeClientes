export const freightMock = {
  calculateDistanceKm: jest.fn(async () => 3.2),
  calculateDeliveryFee: jest.fn(async () => 7.5)
};
