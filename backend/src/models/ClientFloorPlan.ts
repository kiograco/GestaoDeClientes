import {
  Table,
  Column,
  CreatedAt,
  UpdatedAt,
  DeletedAt,
  Model,
  PrimaryKey,
  AutoIncrement,
  ForeignKey,
  BelongsTo,
  HasMany,
  DataType
} from "sequelize-typescript";
import Tenant from "./Tenant";
import Client from "./Client";
import ClientAddress from "./ClientAddress";
import MonitoringPoint from "./MonitoringPoint";

@Table({ tableName: "client_floor_plans", paranoid: true })
class ClientFloorPlan extends Model<ClientFloorPlan> {
  @PrimaryKey
  @AutoIncrement
  @Column
  id: number;

  @ForeignKey(() => Tenant)
  @Column({ field: "tenant_id" })
  tenantId: number;

  @BelongsTo(() => Tenant)
  tenant: Tenant;

  @ForeignKey(() => Client)
  @Column({ field: "client_id" })
  clientId: number;

  @BelongsTo(() => Client)
  client: Client;

  @ForeignKey(() => ClientAddress)
  @Column({ field: "address_id" })
  addressId: number;

  @BelongsTo(() => ClientAddress)
  address: ClientAddress;

  @Column
  name: string;

  @Column({ field: "file_url" })
  fileUrl: string;

  @Column({ field: "file_type" })
  fileType: string;

  @Column({ field: "original_filename" })
  originalFilename: string;

  @Column(DataType.TEXT)
  notes: string;

  @HasMany(() => MonitoringPoint)
  monitoringPoints: MonitoringPoint[];

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

export default ClientFloorPlan;
