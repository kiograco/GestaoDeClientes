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
import Product from "./Product";

@Table
class ProductCategory extends Model<ProductCategory> {
  @PrimaryKey @AutoIncrement @Column id: number;

  @ForeignKey(() => Tenant) @Column tenantId: number;

  @BelongsTo(() => Tenant) tenant: Tenant;

  @Column name: string;

  @Column(DataType.TEXT) description: string;

  @Default(true) @Column isActive: boolean;

  @HasMany(() => Product) products: Product[];

  @CreatedAt createdAt: Date;

  @UpdatedAt updatedAt: Date;
}

export default ProductCategory;
