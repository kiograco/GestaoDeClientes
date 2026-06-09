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
import ServiceOrderItem from "./ServiceOrderItem";
import Tenant from "./Tenant";
import User from "./User";

@Table
class ServiceInventoryMovement extends Model<ServiceInventoryMovement> {
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

  @ForeignKey(() => ServiceOrder)
  @Column
  serviceOrderId: number;

  @BelongsTo(() => ServiceOrder)
  serviceOrder: ServiceOrder;

  @ForeignKey(() => ServiceOrderItem)
  @Column
  serviceOrderItemId: number;

  @BelongsTo(() => ServiceOrderItem)
  serviceOrderItem: ServiceOrderItem;

  @ForeignKey(() => User)
  @Column
  userId: number;

  @BelongsTo(() => User)
  user: User;

  @Column
  movementType: string;

  @Column(DataType.INTEGER)
  quantity: number;

  @Column(DataType.INTEGER)
  previousQuantity: number;

  @Column(DataType.INTEGER)
  newQuantity: number;

  @Column(DataType.TEXT)
  observation: string;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;
}

export default ServiceInventoryMovement;
