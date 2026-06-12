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
import Tenant from "./Tenant";

@Table
class ServiceInventoryBatch extends Model<ServiceInventoryBatch> {
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
  inventoryItemId: number;

  @BelongsTo(() => ServiceInventoryItem)
  inventoryItem: ServiceInventoryItem;

  @Column
  batchNumber: string;

  @Column(DataType.DATEONLY)
  manufacturingDate: string;

  @Column(DataType.DATEONLY)
  expirationDate: string;

  @Column(DataType.INTEGER)
  quantity: number;

  @Column
  supplier: string;

  @Column(DataType.TEXT)
  observation: string;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;
}

export default ServiceInventoryBatch;
