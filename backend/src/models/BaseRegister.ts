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
  DataType
} from "sequelize-typescript";
import Tenant from "./Tenant";

@Table({ tableName: "BaseRegisters", paranoid: true })
class BaseRegister extends Model<BaseRegister> {
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
  module: string;

  @Column
  code: string;

  @Column
  name: string;

  @Column(DataType.TEXT)
  description: string;

  @Default("active")
  @Column
  status: string;

  @Default({})
  @Column(DataType.JSONB)
  data: Record<string, unknown>;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;

  @DeletedAt
  deletedAt: Date;
}

export default BaseRegister;
