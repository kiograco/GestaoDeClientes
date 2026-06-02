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
class DeliveryZone extends Model<DeliveryZone> {
  @PrimaryKey
  @AutoIncrement
  @Column
  id: number;

  @ForeignKey(() => Tenant)
  @Column
  tenantId: number;

  @BelongsTo(() => Tenant)
  tenant: Tenant;

  @Column name: string;

  @Column district: string;

  @Column zipCodeStart: string;

  @Column zipCodeEnd: string;

  @Column(DataType.DECIMAL(12, 2))
  deliveryFee: number;

  @Column estimatedMinutes: number;

  @Default(true)
  @Column
  active: boolean;

  @CreatedAt createdAt: Date;

  @UpdatedAt updatedAt: Date;
}

export default DeliveryZone;
