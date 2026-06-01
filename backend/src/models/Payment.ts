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
import Plan from "./Plan";
import Subscription from "./Subscription";
import Tenant from "./Tenant";

@Table
class Payment extends Model<Payment> {
  @PrimaryKey
  @AutoIncrement
  @Column
  id: number;

  @ForeignKey(() => Tenant)
  @Column
  companyId: number;

  @BelongsTo(() => Tenant)
  company: Tenant;

  @ForeignKey(() => Subscription)
  @Column
  subscriptionId: number;

  @BelongsTo(() => Subscription)
  subscription: Subscription;

  @ForeignKey(() => Plan)
  @Column
  planId: number;

  @BelongsTo(() => Plan)
  plan: Plan;

  @Column
  gateway: string;

  @Unique
  @Column
  externalPaymentId: string;

  @Column(DataType.DECIMAL(10, 2))
  amount: string;

  @Column
  method: string;

  @Column(DataType.DATEONLY)
  dueDate: string;

  @Column
  status: string;

  @Column(DataType.TEXT)
  paymentUrl: string;

  @Column(DataType.TEXT)
  pixQrCode: string;

  @Column(DataType.TEXT)
  pixCopyPaste: string;

  @Column
  renewalAppliedAt: Date;

  @Default({})
  @Column(DataType.JSONB)
  rawPayload: Record<string, unknown>;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;
}

export default Payment;
