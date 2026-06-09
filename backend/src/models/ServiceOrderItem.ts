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
import ServiceOrder from "./ServiceOrder";
import ServiceType from "./ServiceType";
import Tenant from "./Tenant";

@Table
class ServiceOrderItem extends Model<ServiceOrderItem> {
  @PrimaryKey
  @AutoIncrement
  @Column
  id: number;

  @ForeignKey(() => Tenant)
  @Column
  tenantId: number;

  @BelongsTo(() => Tenant)
  tenant: Tenant;

  @ForeignKey(() => ServiceOrder)
  @Column
  serviceOrderId: number;

  @BelongsTo(() => ServiceOrder)
  serviceOrder: ServiceOrder;

  @Column
  itemType: string;

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

  @Column
  description: string;

  @Column(DataType.INTEGER)
  quantity: number;

  @Column(DataType.DECIMAL(12, 2))
  unitPrice: number;

  @Column(DataType.DECIMAL(12, 2))
  totalPrice: number;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;
}

export default ServiceOrderItem;
