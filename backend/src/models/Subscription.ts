import {
  AutoIncrement,
  BelongsTo,
  Column,
  CreatedAt,
  ForeignKey,
  HasMany,
  Model,
  PrimaryKey,
  Table,
  UpdatedAt
} from "sequelize-typescript";
import Payment from "./Payment";
import Plan from "./Plan";
import Tenant from "./Tenant";

@Table
class Subscription extends Model<Subscription> {
  @PrimaryKey
  @AutoIncrement
  @Column
  id: number;

  @ForeignKey(() => Tenant)
  @Column
  companyId: number;

  @BelongsTo(() => Tenant)
  company: Tenant;

  @ForeignKey(() => Plan)
  @Column
  planId: number;

  @BelongsTo(() => Plan)
  plan: Plan;

  @Column
  gateway: string;

  @Column
  externalCustomerId: string;

  @Column
  externalSubscriptionId: string;

  @Column
  status: string;

  @Column
  currentPeriodStart: Date;

  @Column
  currentPeriodEnd: Date;

  @HasMany(() => Payment)
  payments: Payment[];

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;
}

export default Subscription;
