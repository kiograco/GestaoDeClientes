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
  HasMany,
  DataType
} from "sequelize-typescript";
import Tenant from "./Tenant";
import Client from "./Client";
import ClientAddress from "./ClientAddress";
import ClientArea from "./ClientArea";
import ClientSector from "./ClientSector";
import TrapType from "./TrapType";
import MonitoringPointHistory from "./MonitoringPointHistory";

@Table({ tableName: "monitoring_points", paranoid: true })
class MonitoringPoint extends Model<MonitoringPoint> {
  @PrimaryKey
  @AutoIncrement
  @Column
  id: number;

  @ForeignKey(() => Tenant)
  @Column({ field: "tenant_id" })
  tenantId: number;

  @BelongsTo(() => Tenant)
  tenant: Tenant;

  @ForeignKey(() => Client)
  @Column({ field: "client_id" })
  clientId: number;

  @BelongsTo(() => Client)
  client: Client;

  @ForeignKey(() => ClientAddress)
  @Column({ field: "address_id" })
  addressId: number;

  @BelongsTo(() => ClientAddress)
  address: ClientAddress;

  @ForeignKey(() => ClientArea)
  @Column({ field: "area_id" })
  areaId: number;

  @BelongsTo(() => ClientArea)
  area: ClientArea;

  @ForeignKey(() => ClientSector)
  @Column({ field: "sector_id" })
  sectorId: number;

  @BelongsTo(() => ClientSector)
  sector: ClientSector;

  @ForeignKey(() => TrapType)
  @Column({ field: "trap_type_id" })
  trapTypeId: number;

  @BelongsTo(() => TrapType)
  trapType: TrapType;

  @Column
  owner: string;

  @Column({ field: "installed_at" })
  installedAt: Date;

  @Column({ field: "point_number" })
  pointNumber: number;

  @Column
  label: string;

  @Column(DataType.TEXT)
  notes: string;

  @Default(true)
  @Column
  active: boolean;

  @HasMany(() => MonitoringPointHistory)
  history: MonitoringPointHistory[];

  @CreatedAt
  @Column({ field: "created_at" })
  createdAt: Date;

  @UpdatedAt
  @Column({ field: "updated_at" })
  updatedAt: Date;

  @DeletedAt
  @Column({ field: "deleted_at" })
  deletedAt: Date;
}

export default MonitoringPoint;
