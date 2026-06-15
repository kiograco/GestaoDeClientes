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
  BelongsToMany,
  DataType
} from "sequelize-typescript";
import Tenant from "./Tenant";
import MonitoringPoint from "./MonitoringPoint";
import Pest from "./Pest";
import TrapTypePest from "./TrapTypePest";

@Table({ tableName: "trap_types", paranoid: true })
class TrapType extends Model<TrapType> {
  @PrimaryKey
  @AutoIncrement
  @Column
  id: number;

  @ForeignKey(() => Tenant)
  @Column({ field: "tenant_id" })
  tenantId: number;

  @BelongsTo(() => Tenant)
  tenant: Tenant;

  @Column
  name: string;

  @Column
  code: string;

  @Column
  acronym: string;

  @Column
  type: string;

  @Column(DataType.TEXT)
  description: string;

  @Default(true)
  @Column
  active: boolean;

  @HasMany(() => MonitoringPoint)
  monitoringPoints: MonitoringPoint[];

  @HasMany(() => TrapTypePest)
  trapTypePests: TrapTypePest[];

  @BelongsToMany(() => Pest, () => TrapTypePest)
  pests: Pest[];

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

export default TrapType;
