import {
  AutoIncrement,
  Column,
  CreatedAt,
  DataType,
  Default,
  Model,
  PrimaryKey,
  Table,
  Unique
} from "sequelize-typescript";

@Table({ updatedAt: false })
class PaymentWebhookEvent extends Model<PaymentWebhookEvent> {
  @PrimaryKey
  @AutoIncrement
  @Column
  id: number;

  @Column
  gateway: string;

  @Unique
  @Column
  externalEventId: string;

  @Column
  eventType: string;

  @Column
  externalPaymentId: string;

  @Column
  processedAt: Date;

  @Default({})
  @Column(DataType.JSONB)
  rawPayload: Record<string, unknown>;

  @CreatedAt
  createdAt: Date;
}

export default PaymentWebhookEvent;
