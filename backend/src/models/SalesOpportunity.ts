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
  Default,
  DataType
} from "sequelize-typescript";
import Contact from "./Contact";
import ServiceOrder from "./ServiceOrder";
import User from "./User";
import SalesOpportunityLog from "./SalesOpportunityLog";

@Table
class SalesOpportunity extends Model<SalesOpportunity> {
  @PrimaryKey
  @AutoIncrement
  @Column
  id: number;

  @ForeignKey(() => Contact)
  @Column
  contactId: number;

  @BelongsTo(() => Contact)
  contact: Contact;

  @ForeignKey(() => User)
  @Column
  ownerUserId: number;

  @BelongsTo(() => User, "ownerUserId")
  owner: User;

  @ForeignKey(() => ServiceOrder)
  @Column
  convertedServiceOrderId: number;

  @BelongsTo(() => ServiceOrder)
  convertedServiceOrder: ServiceOrder;

  @Column
  tenantId: number;

  @Column
  title: string;

  @Column(DataType.TEXT)
  description: string;

  @Default("novo")
  @Column
  stage: string;

  @Default(0)
  @Column(DataType.DECIMAL(12, 2))
  estimatedValue: number;

  @Column
  expectedCloseDate: Date;

  @Column
  source: string;

  @Column
  lostReason: string;

  @Column(DataType.TEXT)
  notes: string;

  @Column
  wonAt: Date;

  @Column
  lostAt: Date;

  @HasMany(() => SalesOpportunityLog)
  logs: SalesOpportunityLog[];

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;
}

export default SalesOpportunity;
