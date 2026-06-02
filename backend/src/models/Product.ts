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
  HasMany,
  DataType
} from "sequelize-typescript";
import Tenant from "./Tenant";
import ProductCategory from "./ProductCategory";
import ProductOptionGroup from "./ProductOptionGroup";

@Table
class Product extends Model<Product> {
  @PrimaryKey @AutoIncrement @Column id: number;

  @ForeignKey(() => Tenant) @Column tenantId: number;

  @BelongsTo(() => Tenant) tenant: Tenant;

  @ForeignKey(() => ProductCategory) @Column categoryId: number;

  @BelongsTo(() => ProductCategory) category: ProductCategory;

  @Column name: string;

  @Column(DataType.TEXT) description: string;

  @Column imageUrl: string;

  @Column(DataType.DECIMAL(12, 2)) basePrice: number;

  @Default(true) @Column available: boolean;

  @Column saleStartTime: string;

  @Column saleEndTime: string;

  @HasMany(() => ProductOptionGroup) optionGroups: ProductOptionGroup[];

  @CreatedAt createdAt: Date;

  @UpdatedAt updatedAt: Date;
}

export default Product;
