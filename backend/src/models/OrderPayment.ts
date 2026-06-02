import {
  AutoIncrement,
  BelongsTo,
  Column,
  CreatedAt,
  DataType,
  Default,
  ForeignKey,
  Model,
  PrimaryKey,
  Table,
  Unique,
  UpdatedAt
} from "sequelize-typescript";
import Tenant from "./Tenant";
import Order from "./Order";

@Table
class OrderPayment extends Model<OrderPayment> {
  @PrimaryKey @AutoIncrement @Column id: number;

  @ForeignKey(() => Tenant) @Column tenantId: number;

  @BelongsTo(() => Tenant) tenant: Tenant;

  @ForeignKey(() => Order) @Column orderId: number;

  @BelongsTo(() => Order) order: Order;

  @Column method: string;

  @Default("PENDING") @Column status: string;

  @Column(DataType.DECIMAL(12, 2)) amount: number;

  @Column gateway: string;

  @Unique @Column externalPaymentId: string;

  @Column externalReference: string;

  @Column(DataType.TEXT) pixQrCode: string;

  @Column(DataType.TEXT) pixCopyPaste: string;

  @Default({}) @Column(DataType.JSONB) rawPayload: Record<string, unknown>;

  @CreatedAt createdAt: Date;

  @UpdatedAt updatedAt: Date;
}

export default OrderPayment;
