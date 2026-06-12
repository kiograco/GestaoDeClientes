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
import ServiceInventoryItem from "./ServiceInventoryItem";
import ServiceType from "./ServiceType";
import Tenant from "./Tenant";

@Table
class ServiceProduct extends Model<ServiceProduct> {
  @PrimaryKey
  @AutoIncrement
  @Column
  id: number;

  @ForeignKey(() => Tenant)
  @Column
  tenantId: number;

  @BelongsTo(() => Tenant)
  tenant: Tenant;

  @ForeignKey(() => ServiceType)
  @Column
  serviceTypeId: number;

  @BelongsTo(() => ServiceType)
  serviceType: ServiceType;

  @ForeignKey(() => ServiceInventoryItem)
  @Column
  inventoryItemId: number;

  @BelongsTo(() => ServiceInventoryItem)
  inventoryItem: ServiceInventoryItem;

  @Column(DataType.DECIMAL(12, 3))
  averageConsumption: number;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;
}

export default ServiceProduct;
