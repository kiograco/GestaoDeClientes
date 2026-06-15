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
import ClientAreaService from "./ClientAreaService";
import ClientSector from "./ClientSector";

@Table({ tableName: "client_areas", paranoid: true })
class ClientArea extends Model<ClientArea> {
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

  @Column({ field: "area_type" })
  areaType: string;

  @Column(DataType.TEXT)
  description: string;

  @Column(DataType.TEXT)
  notes: string;

  @HasMany(() => ClientAreaService)
  services: ClientAreaService[];

  @HasMany(() => ClientSector)
  sectors: ClientSector[];

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

export default ClientArea;
