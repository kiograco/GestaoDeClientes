import {
  Table,
  Column,
  CreatedAt,
  UpdatedAt,
  Model,
  PrimaryKey,
  AutoIncrement,
  ForeignKey,
  BelongsTo
} from "sequelize-typescript";
import Tenant from "./Tenant";
import TrapType from "./TrapType";
import Pest from "./Pest";

@Table({ tableName: "trap_type_pests" })
class TrapTypePest extends Model<TrapTypePest> {
  @PrimaryKey
  @AutoIncrement
  @Column
  id: number;

  @ForeignKey(() => Tenant)
  @Column({ field: "tenant_id" })
  tenantId: number;

  @BelongsTo(() => Tenant)
  tenant: Tenant;

  @ForeignKey(() => TrapType)
  @Column({ field: "trap_type_id" })
  trapTypeId: number;

  @BelongsTo(() => TrapType)
  trapType: TrapType;

  @ForeignKey(() => Pest)
  @Column({ field: "pest_id" })
  pestId: number;

  @BelongsTo(() => Pest)
  pest: Pest;

  @CreatedAt
  @Column({ field: "created_at" })
  createdAt: Date;

  @UpdatedAt
  @Column({ field: "updated_at" })
  updatedAt: Date;
}

export default TrapTypePest;
