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
import ClientFloorPlan from "./ClientFloorPlan";
import User from "./User";

@Table({ tableName: "monitoring_point_map_history", updatedAt: false })
class MonitoringPointMapHistory extends Model<MonitoringPointMapHistory> {
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

  @ForeignKey(() => ClientFloorPlan)
  @Column({ field: "floor_plan_id" })
  floorPlanId: number;

  @BelongsTo(() => ClientFloorPlan)
  floorPlan: ClientFloorPlan;

  @Column({ field: "old_position_x_percent", type: DataType.DECIMAL(8, 4) })
  oldPositionX: number;

  @Column({ field: "old_position_y_percent", type: DataType.DECIMAL(8, 4) })
  oldPositionY: number;

  @Column({ field: "new_position_x_percent", type: DataType.DECIMAL(8, 4) })
  newPositionX: number;

  @Column({ field: "new_position_y_percent", type: DataType.DECIMAL(8, 4) })
  newPositionY: number;

  @ForeignKey(() => User)
  @Column({ field: "changed_by_user_id" })
  changedByUserId: number;

  @BelongsTo(() => User)
  changedByUser: User;

  @Column(DataType.TEXT)
  notes: string;

  @CreatedAt
  @Column({ field: "created_at" })
  createdAt: Date;
}

export default MonitoringPointMapHistory;
