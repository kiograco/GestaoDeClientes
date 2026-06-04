export const deliveryAddressSnapshot = {
  street: "Rua Teste",
  number: "100",
  district: "Centro",
  city: "Sao Paulo",
  state: "SP",
  zipCode: "01001000"
};

export const manualOrderPayload = (contactId: number, productId: number) => ({
  contactId,
  originChannel: "manual",
  deliveryType: "delivery",
  deliveryAddressSnapshot,
  discount: 2.5,
  items: [
    {
      productId,
      quantity: 2,
      optionIds: []
    }
  ]
});
