import {
  Table,
  Column,
  CreatedAt,
  UpdatedAt,
  DeletedAt,
  Model,
  PrimaryKey,
  AutoIncrement,
  Default,
  ForeignKey,
  BelongsTo
} from "sequelize-typescript";
import Tenant from "./Tenant";
import ServiceAttendant from "./ServiceAttendant";
import ServiceTeam from "./ServiceTeam";

@Table({ tableName: "ServiceTeamAttendants", paranoid: true })
class ServiceTeamAttendant extends Model<ServiceTeamAttendant> {
  @PrimaryKey
  @AutoIncrement
  @Column
  id: number;

  @ForeignKey(() => Tenant)
  @Column
  tenantId: number;

  @BelongsTo(() => Tenant)
  tenant: Tenant;

  @ForeignKey(() => ServiceTeam)
  @Column
  serviceTeamId: number;

  @BelongsTo(() => ServiceTeam)
  serviceTeam: ServiceTeam;

  @ForeignKey(() => ServiceAttendant)
  @Column
  serviceAttendantId: number;

  @BelongsTo(() => ServiceAttendant)
  serviceAttendant: ServiceAttendant;

  @Default(true)
  @Column
  isActive: boolean;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;

  @DeletedAt
  deletedAt: Date;
}

export default ServiceTeamAttendant;
