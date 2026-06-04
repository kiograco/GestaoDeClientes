import { addDays } from "date-fns";
import Contact from "../../src/models/Contact";
import CustomerAddress from "../../src/models/CustomerAddress";
import DeliveryZone from "../../src/models/DeliveryZone";
import Order from "../../src/models/Order";
import OrderPayment from "../../src/models/OrderPayment";
import Plan from "../../src/models/Plan";
import Product from "../../src/models/Product";
import ProductCategory from "../../src/models/ProductCategory";
import ProductOption from "../../src/models/ProductOption";
import ProductOptionGroup from "../../src/models/ProductOptionGroup";
import Subscription from "../../src/models/Subscription";
import Tenant from "../../src/models/Tenant";
import Ticket from "../../src/models/Ticket";
import User from "../../src/models/User";

type Overrides<T> = Partial<Record<keyof T, LegacyAny>>;

const unique = (prefix: string): string =>
  `${prefix}-${Date.now()}-${Math.floor(Math.random() * 100000)}`;

export const createTenant = async (
  overrides: Overrides<Tenant> = {}
): Promise<Tenant> =>
  Tenant.create({
    name: unique("Empresa Teste"),
    status: "active",
    accessExpiresAt: addDays(new Date(), 15),
    businessType: "delivery",
    enabledModules: { delivery: true },
    maxUsers: 10,
    maxConnections: 3,
    ...overrides
  });

export const createUser = async (
  overrides: Overrides<User> = {}
): Promise<User> => {
  const tenantId = overrides.tenantId || (await createTenant()).id;

  return User.create({
    name: "Usuario Teste",
    email: `${unique("user")}@example.test`,
    password: "SenhaTeste123!",
    status: "online",
    profile: "admin",
    tenantId,
    ...overrides
  });
};

export const createAdminUser = (overrides: Overrides<User> = {}) =>
  createUser({ profile: "admin", ...overrides });

export const createAgentUser = (overrides: Overrides<User> = {}) =>
  createUser({ profile: "user", ...overrides });

export const createContact = async (
  overrides: Overrides<Contact> = {}
): Promise<Contact> => {
  const tenantId = overrides.tenantId || (await createTenant()).id;

  return Contact.create({
    name: "Cliente Teste",
    number: unique("551199999"),
    email: `${unique("cliente")}@example.test`,
    tenantId,
    ...overrides
  });
};

export const createTicket = async (
  overrides: Overrides<Ticket> = {}
): Promise<Ticket> => {
  const tenantId = overrides.tenantId || (await createTenant()).id;
  const contactId =
    overrides.contactId || (await createContact({ tenantId })).id;

  return Ticket.create({
    status: "pending",
    unreadMessages: 0,
    lastMessage: "Pedido iniciado",
    channel: "whatsapp",
    contactId,
    tenantId,
    ...overrides
  });
};

export const createCategory = async (
  overrides: Overrides<ProductCategory> = {}
): Promise<ProductCategory> => {
  const tenantId = overrides.tenantId || (await createTenant()).id;

  return ProductCategory.create({
    tenantId,
    name: unique("Categoria"),
    description: "Categoria de teste",
    isActive: true,
    ...overrides
  });
};

export const createProduct = async (
  overrides: Overrides<Product> = {}
): Promise<Product> => {
  const tenantId = overrides.tenantId || (await createTenant()).id;
  const categoryId =
    overrides.categoryId || (await createCategory({ tenantId })).id;

  return Product.create({
    tenantId,
    categoryId,
    name: unique("Produto"),
    description: "Produto de teste",
    basePrice: 25,
    available: true,
    ...overrides
  });
};

export const createProductOptionGroup = async (
  overrides: Overrides<ProductOptionGroup> = {}
): Promise<ProductOptionGroup> => {
  const tenantId = overrides.tenantId || (await createTenant()).id;
  const productId = overrides.productId || (await createProduct({ tenantId })).id;

  return ProductOptionGroup.create({
    tenantId,
    productId,
    name: "Adicionais",
    required: false,
    minSelections: 0,
    maxSelections: 3,
    ...overrides
  });
};

export const createAdditional = async (
  overrides: Overrides<ProductOption> = {}
): Promise<ProductOption> => {
  const tenantId = overrides.tenantId || (await createTenant()).id;
  const groupId =
    overrides.groupId || (await createProductOptionGroup({ tenantId })).id;

  return ProductOption.create({
    tenantId,
    groupId,
    name: "Bacon",
    price: 5,
    available: true,
    ...overrides
  });
};

export const createAddress = async (
  overrides: Overrides<CustomerAddress> = {}
): Promise<CustomerAddress> => {
  const tenantId = overrides.tenantId || (await createTenant()).id;
  const contactId =
    overrides.contactId || (await createContact({ tenantId })).id;

  return CustomerAddress.create({
    tenantId,
    contactId,
    label: "Casa",
    street: "Rua Teste",
    number: "100",
    district: "Centro",
    city: "Sao Paulo",
    state: "SP",
    zipCode: "01001000",
    isDefault: true,
    ...overrides
  });
};

export const createDeliveryZone = async (
  overrides: Overrides<DeliveryZone> = {}
): Promise<DeliveryZone> => {
  const tenantId = overrides.tenantId || (await createTenant()).id;

  return DeliveryZone.create({
    tenantId,
    name: "Centro",
    district: "Centro",
    zipCodeStart: "01000000",
    zipCodeEnd: "01099999",
    deliveryFee: 7.5,
    estimatedMinutes: 40,
    active: true,
    ...overrides
  });
};

export const createOrder = async (
  overrides: Overrides<Order> = {}
): Promise<Order> => {
  const tenantId = overrides.tenantId || (await createTenant()).id;
  const contactId =
    overrides.contactId || (await createContact({ tenantId })).id;

  return Order.create({
    tenantId,
    contactId,
    originChannel: "manual",
    status: "NEW",
    deliveryType: "pickup",
    subtotal: 25,
    deliveryFee: 0,
    discount: 0,
    total: 25,
    ...overrides
  });
};

export const createOrderPayment = async (
  overrides: Overrides<OrderPayment> = {}
): Promise<OrderPayment> => {
  const tenantId = overrides.tenantId || (await createTenant()).id;
  const orderId = overrides.orderId || (await createOrder({ tenantId })).id;

  return OrderPayment.create({
    tenantId,
    orderId,
    method: "PIX",
    status: "PENDING",
    amount: 25,
    gateway: "asaas",
    externalPaymentId: unique("pay"),
    externalReference: unique("order"),
    rawPayload: {},
    ...overrides
  });
};

export const createPlan = async (
  overrides: Overrides<Plan> = {}
): Promise<Plan> =>
  Plan.create({
    name: "Plano Teste",
    price: "99.90",
    durationDays: 30,
    limits: { maxUsers: 10, maxConnections: 3 },
    isActive: true,
    ...overrides
  });

export const createSubscription = async (
  overrides: Overrides<Subscription> = {}
): Promise<Subscription> => {
  const companyId = overrides.companyId || (await createTenant()).id;
  const planId = overrides.planId || (await createPlan()).id;

  return Subscription.create({
    companyId,
    planId,
    gateway: "asaas",
    externalCustomerId: unique("cus"),
    externalSubscriptionId: unique("sub"),
    status: "active",
    currentPeriodStart: new Date(),
    currentPeriodEnd: addDays(new Date(), 30),
    ...overrides
  });
};
