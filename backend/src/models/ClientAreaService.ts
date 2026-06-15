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
  BelongsTo
} from "sequelize-typescript";
import Tenant from "./Tenant";
import ClientArea from "./ClientArea";

@Table({ tableName: "client_area_services", paranoid: true })
class ClientAreaService extends Model<ClientAreaService> {
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

  @Column({ field: "service_name" })
  serviceName: string;

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

export default ClientAreaService;
