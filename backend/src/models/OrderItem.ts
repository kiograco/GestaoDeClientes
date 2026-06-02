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
import Order from "./Order";
import Product from "./Product";
import OrderItemOption from "./OrderItemOption";

@Table
class OrderItem extends Model<OrderItem> {
  @PrimaryKey @AutoIncrement @Column id: number;

  @ForeignKey(() => Order) @Column orderId: number;

  @BelongsTo(() => Order) order: Order;

  @ForeignKey(() => Product) @Column productId: number;

  @BelongsTo(() => Product) product: Product;

  @Column productNameSnapshot: string;

  @Column(DataType.TEXT) productDescriptionSnapshot: string;

  @Column(DataType.DECIMAL(12, 2)) unitPriceSnapshot: number;

  @Column quantity: number;

  @Column(DataType.TEXT) notes: string;

  @Column(DataType.DECIMAL(12, 2)) total: number;

  @HasMany(() => OrderItemOption) options: OrderItemOption[];

  @CreatedAt createdAt: Date;

  @UpdatedAt updatedAt: Date;
}

export default OrderItem;
