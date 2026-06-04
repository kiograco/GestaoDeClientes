export const uploadMock = {
  uploadImage: jest.fn(async () => ({
    url: "https://cdn.example.test/products/image.jpg"
  })),
  removeImage: jest.fn(async () => true)
};
