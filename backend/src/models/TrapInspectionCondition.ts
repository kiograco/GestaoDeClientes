import { Table, Column, Model, ForeignKey } from "sequelize-typescript";
import TrapInspection from "./TrapInspection";
import TrapCondition from "./TrapCondition";

@Table({ tableName: "trap_inspection_conditions", timestamps: false })
class TrapInspectionCondition extends Model<TrapInspectionCondition> {
  @ForeignKey(() => TrapInspection)
  @Column({ field: "inspection_id", primaryKey: true })
  inspectionId: number;

  @ForeignKey(() => TrapCondition)
  @Column({ field: "condition_id", primaryKey: true })
  conditionId: number;

  @Column({ field: "tenant_id" })
  tenantId: number;
}

export default TrapInspectionCondition;
