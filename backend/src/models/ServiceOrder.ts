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
  HasMany,
  DataType
} from "sequelize-typescript";
import Tenant from "./Tenant";
import Contact from "./Contact";
import User from "./User";
import ServiceAttendant from "./ServiceAttendant";
import ServiceOrderLog from "./ServiceOrderLog";

@Table
class ServiceOrder extends Model<ServiceOrder> {
  @PrimaryKey
  @AutoIncrement
  @Column
  id: number;

  @ForeignKey(() => Tenant)
  @Column
  tenantId: number;

  @BelongsTo(() => Tenant)
  tenant: Tenant;

  @ForeignKey(() => Contact)
  @Column
  contactId: number;

  @BelongsTo(() => Contact)
  contact: Contact;

  @ForeignKey(() => ServiceAttendant)
  @Column
  attendantId: number;

  @BelongsTo(() => ServiceAttendant)
  attendant: ServiceAttendant;

  @ForeignKey(() => User)
  @Column
  createdByUserId: number;

  @BelongsTo(() => User)
  createdBy: User;

  @Column
  title: string;

  @Column(DataType.TEXT)
  description: string;

  @Column
  serviceType: string;

  @Column
  priority: string;

  @Column
  status: string;

  @Column
  recurrenceType: string;

  @Column
  recurrenceActive: boolean;

  @Column
  recurrenceDayOfMonth: number;

  @Column
  recurrenceIntervalDays: number;

  @Column
  scheduledStart: Date;

  @Column
  scheduledEnd: Date;

  @Column
  address: string;

  @Column
  addressComplement: string;

  @Column
  city: string;

  @Column
  state: string;

  @Column
  zipCode: string;

  @Column(DataType.TEXT)
  publicObservation: string;

  @Column(DataType.TEXT)
  internalObservation: string;

  @Column
  customerSignatureUrl: string;

  @Column(DataType.JSONB)
  attachmentUrls: string[];

  @Column
  completedAt: Date;

  @Column
  canceledAt: Date;

  @Column(DataType.TEXT)
  cancelReason: string;

  @HasMany(() => ServiceOrderLog)
  logs: ServiceOrderLog[];

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;
}

export default ServiceOrder;
