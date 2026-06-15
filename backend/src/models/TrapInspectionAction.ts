import { Table, Column, Model, ForeignKey } from "sequelize-typescript";
import TrapInspection from "./TrapInspection";
import TrapAction from "./TrapAction";

@Table({ tableName: "trap_inspection_actions", timestamps: false })
class TrapInspectionAction extends Model<TrapInspectionAction> {
  @ForeignKey(() => TrapInspection)
  @Column({ field: "inspection_id", primaryKey: true })
  inspectionId: number;

  @ForeignKey(() => TrapAction)
  @Column({ field: "action_id", primaryKey: true })
  actionId: number;

  @Column({ field: "tenant_id" })
  tenantId: number;
}

export default TrapInspectionAction;
