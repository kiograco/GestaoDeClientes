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

@Table
class ServiceInventoryItem extends Model<ServiceInventoryItem> {
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
  name: string;

  @Column
  sku: string;

  @Column(DataType.TEXT)
  description: string;

  @Column
  unit: string;

  @Default(0)
  @Column(DataType.INTEGER)
  quantity: number;

  @Default(0)
  @Column(DataType.INTEGER)
  minQuantity: number;

  @Column(DataType.DECIMAL(12, 2))
  costPrice: number;

  @Column(DataType.DECIMAL(12, 2))
  salePrice: number;

  @Default(true)
  @Column
  active: boolean;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;
}

export default ServiceInventoryItem;
