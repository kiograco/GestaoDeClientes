import {
  Table,
  Column,
  CreatedAt,
  UpdatedAt,
  Model,
  PrimaryKey,
  AutoIncrement,
  Default,
  ForeignKey,
  BelongsTo,
  DataType
} from "sequelize-typescript";
import Tenant from "./Tenant";
import ProductOptionGroup from "./ProductOptionGroup";

@Table
class ProductOption extends Model<ProductOption> {
  @PrimaryKey @AutoIncrement @Column id: number;

  @ForeignKey(() => Tenant) @Column tenantId: number;

  @BelongsTo(() => Tenant) tenant: Tenant;

  @ForeignKey(() => ProductOptionGroup) @Column groupId: number;

  @BelongsTo(() => ProductOptionGroup) group: ProductOptionGroup;

  @Column name: string;

  @Default(0) @Column(DataType.DECIMAL(12, 2)) price: number;

  @Default(true) @Column available: boolean;

  @CreatedAt createdAt: Date;

  @UpdatedAt updatedAt: Date;
}

export default ProductOption;
