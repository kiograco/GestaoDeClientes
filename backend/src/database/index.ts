import { Sequelize } from "sequelize-typescript";
import User from "../models/User";
import Setting from "../models/Setting";
import Contact from "../models/Contact";
import Ticket from "../models/Ticket";
import Whatsapp from "../models/Whatsapp";
import ContactCustomField from "../models/ContactCustomField";
import Message from "../models/Message";
import MessageOffLine from "../models/MessageOffLine";
import AutoReply from "../models/AutoReply";
import StepsReply from "../models/StepsReply";
import StepsReplyAction from "../models/StepsReplyAction";
import Queue from "../models/Queue";
import UsersQueues from "../models/UsersQueues";
import Tenant from "../models/Tenant";
import AutoReplyLogs from "../models/AutoReplyLogs";
import UserMessagesLog from "../models/UserMessagesLog";
import FastReply from "../models/FastReply";
import Tag from "../models/Tag";
import ContactWallet from "../models/ContactWallet";
import ContactTag from "../models/ContactTag";
import Campaign from "../models/Campaign";
import CampaignContacts from "../models/CampaignContacts";
import ApiConfig from "../models/ApiConfig";
import ApiMessage from "../models/ApiMessage";
import LogTicket from "../models/LogTicket";
import ChatFlow from "../models/ChatFlow";
import Payment from "../models/Payment";
import PaymentWebhookEvent from "../models/PaymentWebhookEvent";
import Plan from "../models/Plan";
import Subscription from "../models/Subscription";
import ProductCategory from "../models/ProductCategory";
import Product from "../models/Product";
import ProductOptionGroup from "../models/ProductOptionGroup";
import ProductOption from "../models/ProductOption";
import CustomerAddress from "../models/CustomerAddress";
import DeliveryZone from "../models/DeliveryZone";
import Order from "../models/Order";
import OrderItem from "../models/OrderItem";
import OrderItemOption from "../models/OrderItemOption";
import OrderStatusHistory from "../models/OrderStatusHistory";
import OrderPayment from "../models/OrderPayment";
import CustomerProfile from "../models/CustomerProfile";
import AuditLog from "../models/AuditLog";
import ServiceAttendant from "../models/ServiceAttendant";
import ServiceInventoryMovement from "../models/ServiceInventoryMovement";
import ServiceInventoryItem from "../models/ServiceInventoryItem";
import ServiceOrder from "../models/ServiceOrder";
import ServiceOrderItem from "../models/ServiceOrderItem";
import ServiceOrderLog from "../models/ServiceOrderLog";
import ServiceType from "../models/ServiceType";
import SalesOpportunity from "../models/SalesOpportunity";
import SalesOpportunityLog from "../models/SalesOpportunityLog";
import * as QueueJobs from "../libs/Queue";
import { logger } from "../utils/logger";

interface CustomSequelize extends Sequelize {
  afterConnect?: LegacyAny;
  afterDisconnect?: LegacyAny;
}

// eslint-disable-next-line
const dbConfig = require("../config/database");
// import dbConfig from "../config/database";

const sequelize: CustomSequelize = new Sequelize(dbConfig);

const models = [
  User,
  Contact,
  Ticket,
  Message,
  MessageOffLine,
  Whatsapp,
  ContactCustomField,
  Setting,
  AutoReply,
  StepsReply,
  StepsReplyAction,
  Queue,
  UsersQueues,
  Tenant,
  AutoReplyLogs,
  UserMessagesLog,
  FastReply,
  Tag,
  ContactWallet,
  ContactTag,
  Campaign,
  CampaignContacts,
  ApiConfig,
  ApiMessage,
  LogTicket,
  ChatFlow,
  Plan,
  Subscription,
  Payment,
  PaymentWebhookEvent,
  ProductCategory,
  Product,
  ProductOptionGroup,
  ProductOption,
  CustomerAddress,
  DeliveryZone,
  Order,
  OrderItem,
  OrderItemOption,
  OrderStatusHistory,
  OrderPayment,
  CustomerProfile,
  AuditLog,
  ServiceAttendant,
  ServiceInventoryMovement,
  ServiceInventoryItem,
  ServiceOrder,
  ServiceOrderItem,
  ServiceOrderLog,
  ServiceType,
  SalesOpportunity,
  SalesOpportunityLog
];

sequelize.addModels(models);

// const startLoopDb = () => {
//   // eslint-disable-next-line no-underscore-dangle
//   global._loopDb = setInterval(() => {
//     FindUpdateTicketsInactiveChatBot();
//     console.log("DATABASE CONNECT");
//   }, 60000);
// };

sequelize.afterConnect(() => {
  logger.info("DATABASE CONNECT");
  QueueJobs.default.add("VerifyTicketsChatBotInactives", {});
  QueueJobs.default.add("SendMessageSchenduled", {});
});

sequelize.afterDisconnect(() => {
  logger.info("DATABASE DISCONNECT");

  // eslint-disable-next-line no-underscore-dangle
  // clearInterval(global._loopDb);
});

export default sequelize;
