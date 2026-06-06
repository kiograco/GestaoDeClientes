import {
  Table,
  Column,
  CreatedAt,
  UpdatedAt,
  Model,
  PrimaryKey,
  AutoIncrement,
  ForeignKey,
  BelongsTo,
  DataType
} from "sequelize-typescript";
import ServiceOrder from "./ServiceOrder";
import User from "./User";

@Table
class ServiceOrderLog extends Model<ServiceOrderLog> {
  @PrimaryKey
  @AutoIncrement
  @Column
  id: number;

  @ForeignKey(() => ServiceOrder)
  @Column
  serviceOrderId: number;

  @BelongsTo(() => ServiceOrder)
  serviceOrder: ServiceOrder;

  @ForeignKey(() => User)
  @Column
  userId: number;

  @BelongsTo(() => User)
  user: User;

  @Column
  action: string;

  @Column(DataType.JSONB)
  oldValue: LegacyAny;

  @Column(DataType.JSONB)
  newValue: LegacyAny;

  @Column(DataType.TEXT)
  description: string;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;
}

export default ServiceOrderLog;
