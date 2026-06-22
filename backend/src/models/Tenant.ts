import {
  Table,
  Column,
  CreatedAt,
  UpdatedAt,
  Model,
  PrimaryKey,
  ForeignKey,
  BelongsTo,
  AutoIncrement,
  DataType
} from "sequelize-typescript";
import User from "./User";

@Table
class Tenant extends Model<Tenant> {
  @PrimaryKey
  @AutoIncrement
  @Column
  id: number;

  @Column({ defaultValue: "active" })
  status: string;

  @Column
  name: string;

  @Column
  cpfCnpj: string;

  @Column
  logoUrl: string;

  @Column
  accessExpiresAt: Date;

  @Column
  maxUsers: number;

  @Column
  maxConnections: number;

  @Column({ defaultValue: "generic" })
  businessType: string;

  @Column(DataType.JSONB)
  enabledModules: { delivery: boolean };

  @Column(DataType.JSONB)
  registrationData: Record<string, unknown>;

  @Column(DataType.JSONB)
  mailSettings: {
    senderName?: string;
    replyTo?: string;
    footerSignature?: string;
  };

  @ForeignKey(() => User)
  @Column
  ownerId: number;

  @BelongsTo(() => User)
  owner: User;

  @Column(DataType.JSONB)
  businessHours: [];

  @Column
  messageBusinessHours: string;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;
}

export default Tenant;
