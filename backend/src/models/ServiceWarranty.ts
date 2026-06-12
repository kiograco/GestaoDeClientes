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
import ServiceType from "./ServiceType";
import Tenant from "./Tenant";

@Table
class ServiceWarranty extends Model<ServiceWarranty> {
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

  @Column(DataType.INTEGER)
  quantity: number;

  @Column
  unit: string;

  @Column(DataType.TEXT)
  observation: string;

  @Column(DataType.TEXT)
  rules: string;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;
}

export default ServiceWarranty;
