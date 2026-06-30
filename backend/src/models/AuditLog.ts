import {
  Table,
  Column,
  CreatedAt,
  Model,
  PrimaryKey,
  AutoIncrement,
  DataType
} from "sequelize-typescript";

@Table({ updatedAt: false })
class AuditLog extends Model<AuditLog> {
  @PrimaryKey
  @AutoIncrement
  @Column
  id: number;

  @Column
  tenantId: number;

  @Column
  userId: number;

  @Column
  action: string;

  @Column
  resource: string;

  @Column
  resourceId: string;

  @Column
  ip: string;

  @Column
  userAgent: string;

  @Column(DataType.JSONB)
  metadata: Record<string, unknown>;

  @CreatedAt
  createdAt: Date;
}

export default AuditLog;
