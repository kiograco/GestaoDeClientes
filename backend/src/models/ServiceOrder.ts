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
import ServiceOrderItem from "./ServiceOrderItem";
import ServiceOrderLog from "./ServiceOrderLog";
import AttendanceType from "./AttendanceType";
import ServiceTeam from "./ServiceTeam";

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

  @ForeignKey(() => ServiceTeam)
  @Column
  serviceTeamId: number;

  @BelongsTo(() => ServiceTeam)
  serviceTeam: ServiceTeam;

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

  @ForeignKey(() => AttendanceType)
  @Column
  attendanceTypeId: number;

  @BelongsTo(() => AttendanceType)
  attendanceType: AttendanceType;

  @Column
  priority: string;

  @Column
  status: string;

  @Column
  financialStatus: string;

  @Column
  paymentMethod: string;

  @Column(DataType.DECIMAL(12, 2))
  chargedAmount: number;

  @Column(DataType.DECIMAL(12, 2))
  paidAmount: number;

  @Column
  paymentDueDate: Date;

  @Column
  paidAt: Date;

  @Column(DataType.TEXT)
  financialObservation: string;

  @Column
  recurrenceType: string;

  @Column
  recurrenceActive: boolean;

  @Column
  recurrenceDayOfMonth: number;

  @Column
  recurrenceIntervalDays: number;

  @ForeignKey(() => ServiceOrder)
  @Column
  recurrenceParentId: number;

  @BelongsTo(() => ServiceOrder, "recurrenceParentId")
  recurrenceParent: ServiceOrder;

  @Column
  recurrenceEndDate: Date;

  @Column
  recurrenceMaxOccurrences: number;

  @Column(DataType.JSONB)
  recurrenceWeekdays: number[];

  @Column
  occurrenceNumber: number;

  @Column
  isRaService: boolean;

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

  @Column
  inventoryDeductedAt: Date;

  @Column(DataType.TEXT)
  cancelReason: string;

  @HasMany(() => ServiceOrderLog)
  logs: ServiceOrderLog[];

  @HasMany(() => ServiceOrderItem)
  items: ServiceOrderItem[];

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;
}

export default ServiceOrder;
