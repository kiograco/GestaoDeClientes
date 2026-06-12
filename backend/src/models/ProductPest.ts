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
import Pest from "./Pest";
import ServiceInventoryItem from "./ServiceInventoryItem";
import Tenant from "./Tenant";

@Table
class ProductPest extends Model<ProductPest> {
  @PrimaryKey
  @AutoIncrement
  @Column
  id: number;

  @ForeignKey(() => Tenant)
  @Column
  tenantId: number;

  @BelongsTo(() => Tenant)
  tenant: Tenant;

  @ForeignKey(() => ServiceInventoryItem)
  @Column
  productId: number;

  @BelongsTo(() => ServiceInventoryItem)
  product: ServiceInventoryItem;

  @ForeignKey(() => Pest)
  @Column
  pestId: number;

  @BelongsTo(() => Pest)
  pest: Pest;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;
}

export default ProductPest;
