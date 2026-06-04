export const whatsappMock = {
  sendMessage: jest.fn(async () => ({ id: "wamid.test" })),
  sendMedia: jest.fn(async () => ({ id: "wamid.media.test" })),
  getProfilePicUrl: jest.fn(async () => null)
};
