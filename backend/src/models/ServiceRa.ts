import {
  Table,
  Column,
  CreatedAt,
  UpdatedAt,
  DeletedAt,
  Model,
  PrimaryKey,
  AutoIncrement,
  ForeignKey,
  BelongsTo,
  DataType
} from "sequelize-typescript";
import Tenant from "./Tenant";
import Contact from "./Contact";
import ClientUnit from "./ClientUnit";
import ServiceAttendant from "./ServiceAttendant";
import ServiceTeam from "./ServiceTeam";
import ServiceOrder from "./ServiceOrder";

@Table({ tableName: "ServiceRas", paranoid: true })
class ServiceRa extends Model<ServiceRa> {
  @PrimaryKey
  @AutoIncrement
  @Column
  id: number;

  @ForeignKey(() => Tenant)
  @Column
  tenantId: number;

  @BelongsTo(() => Tenant)
  tenant: Tenant;

  @ForeignKey(() => Contact)
  @Column
  contactId: number;

  @BelongsTo(() => Contact)
  contact: Contact;

  @ForeignKey(() => ClientUnit)
  @Column
  clientUnitId: number;

  @BelongsTo(() => ClientUnit)
  clientUnit: ClientUnit;

  @ForeignKey(() => ServiceOrder)
  @Column
  serviceOrderId: number;

  @BelongsTo(() => ServiceOrder)
  serviceOrder: ServiceOrder;

  @ForeignKey(() => ServiceAttendant)
  @Column
  attendantId: number;

  @BelongsTo(() => ServiceAttendant)
  attendant: ServiceAttendant;

  @ForeignKey(() => ServiceTeam)
  @Column
  serviceTeamId: number;

  @BelongsTo(() => ServiceTeam)
  serviceTeam: ServiceTeam;

  @Column
  status: string;

  @Column(DataType.TEXT)
  observations: string;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;

  @DeletedAt
  deletedAt: Date;
}

export default ServiceRa;
