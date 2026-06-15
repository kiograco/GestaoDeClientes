import {
  Table,
  Column,
  CreatedAt,
  Model,
  PrimaryKey,
  AutoIncrement,
  ForeignKey,
  BelongsTo,
  DataType
} from "sequelize-typescript";
import Tenant from "./Tenant";
import MonitoringPoint from "./MonitoringPoint";
import ClientArea from "./ClientArea";
import ClientSector from "./ClientSector";

@Table({ tableName: "monitoring_point_history", updatedAt: false })
class MonitoringPointHistory extends Model<MonitoringPointHistory> {
  @PrimaryKey
  @AutoIncrement
  @Column
  id: number;

  @ForeignKey(() => Tenant)
  @Column({ field: "tenant_id" })
  tenantId: number;

  @BelongsTo(() => Tenant)
  tenant: Tenant;

  @ForeignKey(() => MonitoringPoint)
  @Column({ field: "monitoring_point_id" })
  monitoringPointId: number;

  @BelongsTo(() => MonitoringPoint)
  monitoringPoint: MonitoringPoint;

  @Column
  action: string;

  @ForeignKey(() => ClientArea)
  @Column({ field: "previous_area_id" })
  previousAreaId: number;

  @ForeignKey(() => ClientArea)
  @Column({ field: "new_area_id" })
  newAreaId: number;

  @ForeignKey(() => ClientSector)
  @Column({ field: "previous_sector_id" })
  previousSectorId: number;

  @ForeignKey(() => ClientSector)
  @Column({ field: "new_sector_id" })
  newSectorId: number;

  @Column(DataType.TEXT)
  notes: string;

  @Column(DataType.JSONB)
  metadata: Record<string, unknown>;

  @CreatedAt
  @Column({ field: "created_at" })
  createdAt: Date;
}

export default MonitoringPointHistory;
