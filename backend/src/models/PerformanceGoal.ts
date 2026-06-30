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
  Default,
  DataType
} from "sequelize-typescript";
import Tenant from "./Tenant";
import User from "./User";
import ServiceAttendant from "./ServiceAttendant";

@Table
class PerformanceGoal extends Model<PerformanceGoal> {
  @PrimaryKey
  @AutoIncrement
  @Column
  id: number;

  @ForeignKey(() => Tenant)
  @Column
  tenantId: number;

  @BelongsTo(() => Tenant)
  tenant: Tenant;

  @Column
  roleType: string;

  @ForeignKey(() => User)
  @Column(DataType.INTEGER)
  userId: string | number;

  @BelongsTo(() => User)
  user: User;

  @ForeignKey(() => ServiceAttendant)
  @Column
  attendantId: number;

  @BelongsTo(() => ServiceAttendant)
  attendant: ServiceAttendant;

  @Column
  periodMonth: string;

  @Default(0)
  @Column
  targetCount: number;

  @Default(0)
  @Column(DataType.DECIMAL(12, 2))
  targetValue: number;

  @Default(true)
  @Column
  active: boolean;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;
}

export default PerformanceGoal;
