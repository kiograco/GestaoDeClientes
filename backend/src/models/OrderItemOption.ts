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
import OrderItem from "./OrderItem";

@Table
class OrderItemOption extends Model<OrderItemOption> {
  @PrimaryKey @AutoIncrement @Column id: number;

  @ForeignKey(() => OrderItem) @Column orderItemId: number;

  @BelongsTo(() => OrderItem) orderItem: OrderItem;

  @Column optionNameSnapshot: string;

  @Column(DataType.DECIMAL(12, 2)) optionPriceSnapshot: number;

  @CreatedAt createdAt: Date;

  @UpdatedAt updatedAt: Date;
}

export default OrderItemOption;
