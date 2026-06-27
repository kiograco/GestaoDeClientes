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
  BelongsTo,
  BelongsToMany,
  HasMany
} from "sequelize-typescript";
import Tenant from "./Tenant";
import ServiceAttendant from "./ServiceAttendant";
import ServiceOrder from "./ServiceOrder";
import ServiceTeamAttendant from "./ServiceTeamAttendant";

@Table({ tableName: "ServiceTeams", paranoid: true })
class ServiceTeam extends Model<ServiceTeam> {
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
  code: string;

  @ForeignKey(() => ServiceAttendant)
  @Column
  responsibleId: number;

  @BelongsTo(() => ServiceAttendant, "responsibleId")
  responsible: ServiceAttendant;

  @Default(true)
  @Column
  isActive: boolean;

  @BelongsToMany(() => ServiceAttendant, () => ServiceTeamAttendant)
  attendants: ServiceAttendant[];

  @HasMany(() => ServiceOrder)
  serviceOrders: ServiceOrder[];

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;

  @DeletedAt
  deletedAt: Date;
}

export default ServiceTeam;
