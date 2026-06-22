import {
  Table,
  Column,
  CreatedAt,
  Model,
  PrimaryKey,
  AutoIncrement,
  ForeignKey,
  BelongsTo,
  DataType
} from "sequelize-typescript";
import Tenant from "./Tenant";

@Table({ tableName: "email_logs", updatedAt: false })
class EmailLog extends Model<EmailLog> {
  @PrimaryKey
  @AutoIncrement
  @Column
  id: number;

  @ForeignKey(() => Tenant)
  @Column({ field: "tenant_id" })
  tenantId: number;

  @BelongsTo(() => Tenant)
  tenant: Tenant;

  @Column
  recipient: string;

  @Column
  subject: string;

  @Column
  template: string;

  @Column
  provider: string;

  @Column
  status: string;

  @Column({ field: "provider_message_id" })
  providerMessageId: string;

  @Column({ field: "error_message", type: DataType.TEXT })
  errorMessage: string;

  @CreatedAt
  @Column({ field: "created_at" })
  createdAt: Date;
}

export default EmailLog;
