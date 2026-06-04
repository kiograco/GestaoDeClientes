import AppError from "../../../src/errors/AppError";
import Contact from "../../../src/models/Contact";
import Order from "../../../src/models/Order";
import OrderItem from "../../../src/models/OrderItem";
import OrderItemOption from "../../../src/models/OrderItemOption";
import OrderStatusHistory from "../../../src/models/OrderStatusHistory";
import Product from "../../../src/models/Product";
import ProductOption from "../../../src/models/ProductOption";
import ProductOptionGroup from "../../../src/models/ProductOptionGroup";
import Ticket from "../../../src/models/Ticket";
import {
  createOrder,
  ORDER_STATUSES,
  updateOrderStatus
} from "../../../src/services/DeliveryOrderServices/DeliveryOrderService";
import { resolveZone } from "../../../src/services/DeliveryAddressServices/DeliveryAddressService";

jest.mock("../../../src/database", () => ({
  __esModule: true,
  default: {
    transaction: jest.fn(async callback => callback({ id: "tx" }))
  }
}));

jest.mock("../../../src/models/Contact", () => ({ findOne: jest.fn() }));
jest.mock("../../../src/models/Ticket", () => ({ findOne: jest.fn() }));
jest.mock("../../../src/models/Product", () => ({ findOne: jest.fn() }));
jest.mock("../../../src/models/ProductOptionGroup", () => ({
  findAll: jest.fn()
}));
jest.mock("../../../src/models/ProductOption", () => ({ findAll: jest.fn() }));
jest.mock("../../../src/models/Order", () => ({
  create: jest.fn(),
  findByPk: jest.fn(),
  findOne: jest.fn()
}));
jest.mock("../../../src/models/OrderItem", () => ({ create: jest.fn() }));
jest.mock("../../../src/models/OrderItemOption", () => ({
  bulkCreate: jest.fn()
}));
jest.mock("../../../src/models/OrderStatusHistory", () => ({
  create: jest.fn()
}));
jest.mock(
  "../../../src/services/DeliveryAddressServices/DeliveryAddressService",
  () => ({ resolveZone: jest.fn() })
);

describe("DeliveryOrderService", () => {
  beforeEach(() => {
    (Contact.findOne as jest.Mock).mockResolvedValue({ id: 10 });
    (Ticket.findOne as jest.Mock).mockResolvedValue({ id: 20 });
    (Product.findOne as jest.Mock).mockResolvedValue({
      id: 30,
      name: "Pizza",
      description: "Grande",
      basePrice: 42.2
    });
    (ProductOptionGroup.findAll as jest.Mock).mockResolvedValue([]);
    (ProductOption.findAll as jest.Mock).mockResolvedValue([]);
    (resolveZone as jest.Mock).mockResolvedValue({ deliveryFee: 7.5 });
    (Order.create as jest.Mock).mockResolvedValue({ id: 99 });
    (OrderItem.create as jest.Mock).mockResolvedValue({ id: 100 });
    (Order.findByPk as jest.Mock).mockResolvedValue({
      id: 99,
      subtotal: 84.4,
      deliveryFee: 7.5,
      discount: 4.9,
      total: 87
    });
  });

  it("calcula subtotal, taxa, desconto e total do pedido", async () => {
    const order = await createOrder(1, "7", {
      contactId: 10,
      ticketId: 20,
      originChannel: "manual",
      deliveryType: "delivery",
      deliveryAddressSnapshot: { district: "Centro", zipCode: "01001000" },
      discount: 4.9,
      items: [{ productId: 30, quantity: 2 }]
    });

    expect(Order.create).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: 1,
        status: "NEW",
        subtotal: 84.4,
        deliveryFee: 7.5,
        discount: 4.9,
        total: 87
      }),
      expect.any(Object)
    );
    expect(OrderStatusHistory.create).toHaveBeenCalledWith(
      expect.objectContaining({ newStatus: "NEW", changedBy: "7" }),
      expect.any(Object)
    );
    expect(order.total).toBe(87);
  });

  it("rejeita opcao duplicada no carrinho", async () => {
    await expect(
      createOrder(1, "7", {
        contactId: 10,
        originChannel: "manual",
        deliveryType: "pickup",
        items: [{ productId: 30, quantity: 1, optionIds: [1, 1] }]
      })
    ).rejects.toMatchObject({ message: "ERR_INVALID_PRODUCT_OPTION" });
  });

  it("valida status permitido do pedido", async () => {
    expect(ORDER_STATUSES).toContain("OUT_FOR_DELIVERY");

    await expect(updateOrderStatus(1, "7", "99", "UNKNOWN")).rejects.toBeInstanceOf(
      AppError
    );
  });

  it("registra historico ao alterar status", async () => {
    const order = {
      id: 99,
      status: "NEW",
      update: jest.fn(async () => undefined)
    };

    (Order.findOne as jest.Mock).mockResolvedValue(order);
    (Order.findByPk as jest.Mock).mockResolvedValue({
      id: 99,
      status: "PREPARING"
    });

    await updateOrderStatus(1, "7", "99", "PREPARING");

    expect(order.update).toHaveBeenCalledWith(
      { status: "PREPARING" },
      expect.any(Object)
    );
    expect(OrderStatusHistory.create).toHaveBeenCalledWith(
      expect.objectContaining({
        oldStatus: "NEW",
        newStatus: "PREPARING",
        changedBy: "7"
      }),
      expect.any(Object)
    );
  });
});
