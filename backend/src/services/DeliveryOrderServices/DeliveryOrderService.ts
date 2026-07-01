import { Op } from "sequelize";
import sequelize from "../../database";
import AppError from "../../errors/AppError";
import Contact from "../../models/Contact";
import Order from "../../models/Order";
import OrderItem from "../../models/OrderItem";
import OrderItemOption from "../../models/OrderItemOption";
import OrderStatusHistory from "../../models/OrderStatusHistory";
import Product from "../../models/Product";
import ProductOption from "../../models/ProductOption";
import ProductOptionGroup from "../../models/ProductOptionGroup";
import Ticket from "../../models/Ticket";
import { resolveZone } from "../DeliveryAddressServices/DeliveryAddressService";
import OrderPayment from "../../models/OrderPayment";

export const ORDER_STATUSES = [
  "NEW",
  "WAITING_PAYMENT",
  "CONFIRMED",
  "PREPARING",
  "READY",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "CANCELLED"
];

interface ItemData {
  productId: number;
  quantity: number;
  notes?: string | null;
  optionIds?: number[];
}

interface CreateOrderData {
  contactId: number;
  ticketId?: number | null;
  originChannel: "whatsapp" | "instagram" | "facebook" | "manual";
  deliveryType: "pickup" | "delivery";
  deliveryFee?: number;
  discount?: number;
  deliveryAddressSnapshot?: Record<string, unknown> | null;
  notes?: string | null;
  items: ItemData[];
}

const orderInclude = [
  { model: Contact, as: "contact", attributes: ["id", "name", "number"] },
  {
    model: OrderItem,
    as: "items",
    include: [{ model: OrderItemOption, as: "options" }]
  },
  { model: OrderStatusHistory, as: "statusHistory" },
  { model: OrderPayment, as: "payments" }
];

const money = (value: number): number => Math.round(value * 100) / 100;

const validateReferences = async (
  tenantId: number,
  contactId: number,
  ticketId?: number | null
) => {
  const contact = await Contact.findOne({ where: { id: contactId, tenantId } });
  if (!contact) throw new AppError("ERR_NO_CONTACT_FOUND", 404);
  if (!ticketId) return;
  const ticket = await Ticket.findOne({
    where: { id: ticketId, contactId, tenantId }
  });
  if (!ticket) throw new AppError("ERR_NO_TICKET_FOUND", 404);
};

const buildItem = async (
  tenantId: number,
  data: ItemData,
  transaction: LegacyAny
) => {
  const product = await Product.findOne({
    where: { id: data.productId, tenantId, available: true },
    transaction
  });
  if (!product) throw new AppError("ERR_NO_PRODUCT_FOUND", 404);
  const optionIds = [...new Set(data.optionIds || [])];
  if (optionIds.length !== (data.optionIds || []).length) {
    throw new AppError("ERR_INVALID_PRODUCT_OPTION", 400);
  }
  const groups = await ProductOptionGroup.findAll({
    where: { productId: product.id, tenantId },
    transaction
  });
  const options = optionIds.length
    ? await ProductOption.findAll({
        where: { id: { [Op.in]: optionIds }, tenantId, available: true },
        include: [
          {
            model: ProductOptionGroup,
            as: "group",
            where: { productId: product.id, tenantId }
          }
        ],
        transaction
      })
    : [];
  if (options.length !== optionIds.length) {
    throw new AppError("ERR_INVALID_PRODUCT_OPTION", 400);
  }
  groups.forEach(group => {
    const selections = options.filter(
      option => option.groupId === group.id
    ).length;
    if (
      selections < group.minSelections ||
      selections > group.maxSelections ||
      (group.required && selections === 0)
    ) {
      throw new AppError("ERR_INVALID_PRODUCT_OPTION_SELECTIONS", 400);
    }
  });
  const optionsTotal = options.reduce(
    (total, option) => total + Number(option.price),
    0
  );
  const unitPrice = money(Number(product.basePrice) + optionsTotal);
  return {
    product,
    options,
    unitPrice,
    total: money(unitPrice * data.quantity)
  };
};

export const listOrders = async (
  tenantId: number,
  status?: string,
  searchParam?: string,
  contactId?: string,
  ticketId?: string
): Promise<Order[]> => {
  const where: LegacyAny = { tenantId };
  if (status) where.status = status;
  if (searchParam) where.id = Number(searchParam) || 0;
  if (contactId) where.contactId = contactId;
  if (ticketId) where.ticketId = ticketId;
  return Order.findAll({
    where,
    include: orderInclude,
    order: [["createdAt", "DESC"]]
  });
};

export const createOrder = async (
  tenantId: number,
  userId: string,
  data: CreateOrderData
): Promise<Order> => {
  await validateReferences(tenantId, data.contactId, data.ticketId);
  if (data.deliveryType === "delivery" && !data.deliveryAddressSnapshot) {
    throw new AppError("ERR_DELIVERY_ADDRESS_REQUIRED", 400);
  }
  const deliveryZone =
    data.deliveryType === "delivery" && data.deliveryAddressSnapshot
      ? await resolveZone(
          tenantId,
          String(data.deliveryAddressSnapshot.district || ""),
          String(data.deliveryAddressSnapshot.zipCode || "")
        )
      : null;

  const orderId = await sequelize.transaction(async transaction => {
    const preparedItems = await Promise.all(
      data.items.map(item => buildItem(tenantId, item, transaction))
    );
    const subtotal = money(
      preparedItems.reduce((total, item) => total + item.total, 0)
    );
    const deliveryFee = deliveryZone
      ? money(Number(deliveryZone.deliveryFee))
      : 0;
    const discount = money(data.discount || 0);
    const total = money(Math.max(0, subtotal + deliveryFee - discount));
    const order = await Order.create(
      {
        ...data,
        tenantId,
        status: "NEW",
        subtotal,
        deliveryFee,
        discount,
        total
      } as LegacyAny,
      { transaction }
    );
    await Promise.all(
      preparedItems.map(async (prepared, index) => {
        const itemData = data.items[index];
        const item = await OrderItem.create(
          {
            orderId: order.id,
            productId: prepared.product.id,
            productNameSnapshot: prepared.product.name,
            productDescriptionSnapshot: prepared.product.description,
            unitPriceSnapshot: prepared.unitPrice,
            quantity: itemData.quantity,
            notes: itemData.notes,
            total: prepared.total
          } as LegacyAny,
          { transaction }
        );
        await OrderItemOption.bulkCreate(
          prepared.options.map(option => ({
            orderItemId: item.id,
            optionNameSnapshot: option.name,
            optionPriceSnapshot: option.price
          })),
          { transaction }
        );
      })
    );
    await OrderStatusHistory.create(
      {
        orderId: order.id,
        oldStatus: null,
        newStatus: "NEW",
        changedBy: userId
      } as LegacyAny,
      { transaction }
    );
    return order.id;
  });

  const createdOrder = await Order.findByPk(orderId, { include: orderInclude });
  return createdOrder as Order;
};

export const updateOrderStatus = async (
  tenantId: number,
  userId: string,
  orderId: string,
  status: string
): Promise<Order> => {
  if (!ORDER_STATUSES.includes(status))
    throw new AppError("ERR_INVALID_ORDER_STATUS", 400);
  const order = await Order.findOne({ where: { id: orderId, tenantId } });
  if (!order) throw new AppError("ERR_NO_ORDER_FOUND", 404);
  if (order.status === status) return order;
  const oldStatus = order.status;
  await sequelize.transaction(async transaction => {
    await order.update({ status }, { transaction });
    await OrderStatusHistory.create(
      {
        orderId: order.id,
        oldStatus,
        newStatus: status,
        changedBy: userId
      } as LegacyAny,
      { transaction }
    );
  });
  const updatedOrder = await Order.findByPk(order.id, {
    include: orderInclude
  });
  return updatedOrder as Order;
};
