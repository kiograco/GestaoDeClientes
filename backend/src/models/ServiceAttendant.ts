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
  HasMany,
  DataType
} from "sequelize-typescript";
import Tenant from "./Tenant";
import ServiceOrder from "./ServiceOrder";

@Table
class ServiceAttendant extends Model<ServiceAttendant> {
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
  email: string;

  @Column
  phone: string;

  @Column
  specialty: string;

  @Default(true)
  @Column
  active: boolean;

  @Column(DataType.JSONB)
  workingHours: LegacyAny;

  @HasMany(() => ServiceOrder)
  serviceOrders: ServiceOrder[];

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;
}

export default ServiceAttendant;
