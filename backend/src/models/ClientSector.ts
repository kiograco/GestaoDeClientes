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
  DataType
} from "sequelize-typescript";
import Tenant from "./Tenant";
import ClientArea from "./ClientArea";

@Table({ tableName: "client_sectors", paranoid: true })
class ClientSector extends Model<ClientSector> {
  @PrimaryKey
  @AutoIncrement
  @Column
  id: number;

  @ForeignKey(() => Tenant)
  @Column({ field: "tenant_id" })
  tenantId: number;

  @BelongsTo(() => Tenant)
  tenant: Tenant;

  @ForeignKey(() => ClientArea)
  @Column({ field: "area_id" })
  areaId: number;

  @BelongsTo(() => ClientArea)
  area: ClientArea;

  @Column
  name: string;

  @Column(DataType.TEXT)
  description: string;

  @Column(DataType.TEXT)
  notes: string;

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

export default ClientSector;
