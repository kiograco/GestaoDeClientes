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
  HasMany
} from "sequelize-typescript";
import Tenant from "./Tenant";
import Product from "./Product";
import ProductOption from "./ProductOption";

@Table
class ProductOptionGroup extends Model<ProductOptionGroup> {
  @PrimaryKey @AutoIncrement @Column id: number;

  @ForeignKey(() => Tenant) @Column tenantId: number;

  @BelongsTo(() => Tenant) tenant: Tenant;

  @ForeignKey(() => Product) @Column productId: number;

  @BelongsTo(() => Product) product: Product;

  @Column name: string;

  @Default(false) @Column required: boolean;

  @Default(0) @Column minSelections: number;

  @Default(1) @Column maxSelections: number;

  @HasMany(() => ProductOption) options: ProductOption[];

  @CreatedAt createdAt: Date;

  @UpdatedAt updatedAt: Date;
}

export default ProductOptionGroup;
