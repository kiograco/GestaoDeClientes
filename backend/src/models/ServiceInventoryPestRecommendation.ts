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
class ServiceInventoryPestRecommendation extends Model<ServiceInventoryPestRecommendation> {
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
  pest: string;

  @Column(DataType.DECIMAL(12, 3))
  productQuantity: number;

  @Column(DataType.DECIMAL(12, 3))
  diluentQuantity: number;

  @Column
  unit: string;

  @Column
  actionTime: string;

  @Column(DataType.TEXT)
  technicalObservation: string;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;
}

export default ServiceInventoryPestRecommendation;
