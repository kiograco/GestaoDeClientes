const token = "e2e-token";

const tenant = {
  tenantId: 1,
  tenantName: "Empresa E2E",
  businessType: "delivery",
  enabledModules: { delivery: true },
  accessExpiresAt: "2099-12-31T23:59:59.000Z",
  accessDaysRemaining: 999,
  subscriptionExpired: false
};

const user = {
  token,
  username: "Admin E2E",
  email: "admin@example.test",
  profile: "admin",
  status: "online",
  userId: 1,
  queues: [],
  configs: {},
  ...tenant
};

const contact = {
  id: 10,
  name: "Cliente E2E",
  number: "5511999990000",
  email: "cliente@example.test",
  tenantId: 1
};

const ticket = {
  id: 20,
  status: "open",
  channel: "whatsapp",
  contactId: contact.id,
  contact,
  lastMessage: "Quero fazer um pedido"
};

const category = {
  id: 30,
  name: "Lanches",
  description: "Cardapio E2E",
  isActive: true
};

const product = {
  id: 40,
  categoryId: category.id,
  name: "Burger E2E",
  description: "Burger com queijo",
  basePrice: "25.00",
  available: true,
  optionGroups: []
};

const order = {
  id: 50,
  contactId: contact.id,
  ticketId: ticket.id,
  originChannel: "manual",
  deliveryType: "delivery",
  status: "NEW",
  subtotal: "50.00",
  deliveryFee: "8.00",
  discount: "0.00",
  total: "58.00",
  contact,
  items: [
    {
      id: 1,
      productNameSnapshot: product.name,
      quantity: 2,
      total: "50.00"
    }
  ]
};

module.exports = {
  token,
  user,
  tenant,
  contact,
  ticket,
  category,
  product,
  order
};
