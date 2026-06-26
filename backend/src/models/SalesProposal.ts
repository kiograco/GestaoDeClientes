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
  Default,
  DataType
} from "sequelize-typescript";
import Contact from "./Contact";
import SalesOpportunity from "./SalesOpportunity";
import ServiceOrder from "./ServiceOrder";
import User from "./User";
import AttendanceType from "./AttendanceType";

@Table
class SalesProposal extends Model<SalesProposal> {
  @PrimaryKey
  @AutoIncrement
  @Column
  id: number;

  @Column
  tenantId: number;

  @ForeignKey(() => SalesOpportunity)
  @Column
  salesOpportunityId: number;

  @BelongsTo(() => SalesOpportunity)
  salesOpportunity: SalesOpportunity;

  @ForeignKey(() => Contact)
  @Column
  contactId: number;

  @BelongsTo(() => Contact)
  contact: Contact;

  @ForeignKey(() => User)
  @Column
  createdByUserId: number;

  @BelongsTo(() => User, "createdByUserId")
  createdBy: User;

  @ForeignKey(() => ServiceOrder)
  @Column
  convertedServiceOrderId: number;

  @BelongsTo(() => ServiceOrder)
  convertedServiceOrder: ServiceOrder;

  @ForeignKey(() => AttendanceType)
  @Column
  attendanceTypeId: number;

  @BelongsTo(() => AttendanceType)
  attendanceType: AttendanceType;

  @Column
  title: string;

  @Column(DataType.TEXT)
  introduction: string;

  @Default("rascunho")
  @Column
  status: string;

  @Column
  validUntil: Date;

  @Default([])
  @Column(DataType.JSON)
  items: Array<Record<string, unknown>>;

  @Default(0)
  @Column(DataType.DECIMAL(12, 2))
  subtotal: number;

  @Default(0)
  @Column(DataType.DECIMAL(12, 2))
  discount: number;

  @Default(0)
  @Column(DataType.DECIMAL(12, 2))
  total: number;

  @Column(DataType.TEXT)
  observation: string;

  @Column
  publicToken: string;

  @Column
  approvedAt: Date;

  @Column
  convertedAt: Date;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;
}

export default SalesProposal;
