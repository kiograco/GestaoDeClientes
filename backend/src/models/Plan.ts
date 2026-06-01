import {
  AutoIncrement,
  Column,
  CreatedAt,
  DataType,
  Default,
  HasMany,
  Model,
  PrimaryKey,
  Table,
  UpdatedAt
} from "sequelize-typescript";
import Payment from "./Payment";
import Subscription from "./Subscription";

@Table
class Plan extends Model<Plan> {
  @PrimaryKey
  @AutoIncrement
  @Column
  id: number;

  @Column
  name: string;

  @Column(DataType.DECIMAL(10, 2))
  price: string;

  @Column
  durationDays: number;

  @Default({})
  @Column(DataType.JSONB)
  limits: { maxUsers?: number; maxConnections?: number };

  @Default(true)
  @Column
  isActive: boolean;

  @HasMany(() => Subscription)
  subscriptions: Subscription[];

  @HasMany(() => Payment)
  payments: Payment[];

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;
}

export default Plan;
