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
import ServiceType from "./ServiceType";
import Tenant from "./Tenant";

@Table
class ServiceMethod extends Model<ServiceMethod> {
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

  @Column
  method: string;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;
}

export default ServiceMethod;
