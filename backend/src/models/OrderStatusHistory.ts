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
import Order from "./Order";
import User from "./User";

@Table
class OrderStatusHistory extends Model<OrderStatusHistory> {
  @PrimaryKey @AutoIncrement @Column id: number;

  @ForeignKey(() => Order) @Column orderId: number;

  @BelongsTo(() => Order) order: Order;

  @Column oldStatus: string;

  @Column newStatus: string;

  @ForeignKey(() => User) @Column changedBy: number;

  @BelongsTo(() => User) user: User;

  @CreatedAt createdAt: Date;

  @UpdatedAt updatedAt: Date;
}

export default OrderStatusHistory;
