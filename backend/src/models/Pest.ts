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
  HasMany
} from "sequelize-typescript";
import ProductPest from "./ProductPest";
import ServicePest from "./ServicePest";
import Tenant from "./Tenant";

@Table
class Pest extends Model<Pest> {
  @PrimaryKey
  @AutoIncrement
  @Column
  id: number;

  @ForeignKey(() => Tenant)
  @Column
  tenantId: number;

  @BelongsTo(() => Tenant)
  tenant: Tenant;

  @Column
  commonName: string;

  @Column
  scientificName: string;

  @HasMany(() => ProductPest)
  productPests: ProductPest[];

  @HasMany(() => ServicePest)
  servicePests: ServicePest[];

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;
}

export default Pest;
