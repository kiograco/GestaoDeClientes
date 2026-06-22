import {
  Table,
  Column,
  CreatedAt,
  UpdatedAt,
  Model,
  PrimaryKey,
  AutoIncrement,
  ForeignKey,
  BelongsTo
} from "sequelize-typescript";
import Tenant from "./Tenant";
import User from "./User";
import ServiceOrder from "./ServiceOrder";
import ServiceAttendant from "./ServiceAttendant";

@Table
class ServiceOrderOccurrenceException extends Model<ServiceOrderOccurrenceException> {
  @PrimaryKey
  @AutoIncrement
  @Column
  id: number;

  @ForeignKey(() => Tenant)
  @Column
  tenantId: number;

  @ForeignKey(() => ServiceOrder)
  @Column
  serviceOrderId: number;

  @BelongsTo(() => ServiceOrder)
  serviceOrder: ServiceOrder;

  @Column
  occurrenceStart: Date;

  @Column
  scheduledStart: Date;

  @Column
  scheduledEnd: Date;

  @ForeignKey(() => ServiceAttendant)
  @Column
  attendantId: number;

  @BelongsTo(() => ServiceAttendant)
  attendant: ServiceAttendant;

  @Column
  status: string;

  @ForeignKey(() => User)
  @Column
  createdByUserId: number;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;
}

export default ServiceOrderOccurrenceException;
