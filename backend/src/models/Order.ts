import {
  Table,
  Column,
  CreatedAt,
  UpdatedAt,
  Model,
  PrimaryKey,
  AutoIncrement,
  Default,
  ForeignKey,
  BelongsTo,
  HasMany,
  DataType
} from "sequelize-typescript";
import Tenant from "./Tenant";
import Contact from "./Contact";
import Ticket from "./Ticket";
import OrderItem from "./OrderItem";
import OrderStatusHistory from "./OrderStatusHistory";

@Table
class Order extends Model<Order> {
  @PrimaryKey @AutoIncrement @Column id: number;

  @ForeignKey(() => Tenant) @Column tenantId: number;

  @BelongsTo(() => Tenant) tenant: Tenant;

  @ForeignKey(() => Contact) @Column contactId: number;

  @BelongsTo(() => Contact) contact: Contact;

  @ForeignKey(() => Ticket) @Column ticketId: number;

  @BelongsTo(() => Ticket) ticket: Ticket;

  @Column originChannel: string;

  @Default("NEW") @Column status: string;

  @Column deliveryType: string;

  @Column(DataType.DECIMAL(12, 2)) subtotal: number;

  @Default(0) @Column(DataType.DECIMAL(12, 2)) deliveryFee: number;

  @Default(0) @Column(DataType.DECIMAL(12, 2)) discount: number;

  @Column(DataType.DECIMAL(12, 2)) total: number;

  @Column(DataType.JSONB) deliveryAddressSnapshot: Record<string, unknown>;

  @Column(DataType.TEXT) notes: string;

  @HasMany(() => OrderItem) items: OrderItem[];

  @HasMany(() => OrderStatusHistory) statusHistory: OrderStatusHistory[];

  @CreatedAt createdAt: Date;

  @UpdatedAt updatedAt: Date;
}

export default Order;
