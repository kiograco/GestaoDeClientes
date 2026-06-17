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
import ClientFloorPlan from "./ClientFloorPlan";
import TrapType from "./TrapType";
import MonitoringPointHistory from "./MonitoringPointHistory";
import MonitoringPointMapHistory from "./MonitoringPointMapHistory";
import TrapInspection from "./TrapInspection";

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

  @ForeignKey(() => ClientFloorPlan)
  @Column({ field: "floor_plan_id" })
  floorPlanId: number;

  @BelongsTo(() => ClientFloorPlan)
  floorPlan: ClientFloorPlan;

  @Column({ field: "position_x_percent", type: DataType.DECIMAL(8, 4) })
  positionX: number;

  @Column({ field: "position_y_percent", type: DataType.DECIMAL(8, 4) })
  positionY: number;

  @Column({ field: "map_label" })
  mapLabel: string;

  @Column({ field: "marker_color" })
  markerColor: string;

  @Column({ field: "marker_icon_url" })
  markerIconUrl: string;

  @Default("color")
  @Column({ field: "marker_type" })
  markerType: string;

  @Default(false)
  @Column({ field: "is_positioned" })
  isPositioned: boolean;

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

  @HasMany(() => MonitoringPointMapHistory)
  mapHistory: MonitoringPointMapHistory[];

  @HasMany(() => TrapInspection)
  inspections: TrapInspection[];

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
