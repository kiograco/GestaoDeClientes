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
class ServicePest extends Model<ServicePest> {
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
  name: string;

  @Column
  scientificName: string;

  @Column
  category: string;

  @Column
  active: boolean;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;
}

export default ServicePest;
