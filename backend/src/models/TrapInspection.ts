import {
  Table,
  Column,
  CreatedAt,
  UpdatedAt,
  Model,
  PrimaryKey,
  AutoIncrement,
  ForeignKey,
  BelongsTo,
  BelongsToMany,
  DataType
} from "sequelize-typescript";
import Tenant from "./Tenant";
import MonitoringPoint from "./MonitoringPoint";
import User from "./User";
import TrapCondition from "./TrapCondition";
import TrapAction from "./TrapAction";
import TrapInspectionCondition from "./TrapInspectionCondition";
import TrapInspectionAction from "./TrapInspectionAction";

@Table({ tableName: "trap_inspections" })
class TrapInspection extends Model<TrapInspection> {
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

  @ForeignKey(() => User)
  @Column({ field: "technician_id" })
  technicianId: number;

  @BelongsTo(() => User, "technicianId")
  technician: User;

  @Column({ field: "inspection_date" })
  inspectionDate: Date;

  @Column(DataType.TEXT)
  notes: string;

  @BelongsToMany(() => TrapCondition, () => TrapInspectionCondition)
  conditions: TrapCondition[];

  @BelongsToMany(() => TrapAction, () => TrapInspectionAction)
  actions: TrapAction[];

  @CreatedAt
  @Column({ field: "created_at" })
  createdAt: Date;

  @UpdatedAt
  @Column({ field: "updated_at" })
  updatedAt: Date;
}

export default TrapInspection;
