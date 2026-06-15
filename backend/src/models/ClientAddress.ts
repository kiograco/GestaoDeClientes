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
import Client from "./Client";

@Table({ tableName: "client_addresses", paranoid: true })
class ClientAddress extends Model<ClientAddress> {
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

  @Column({ field: "address_type" })
  addressType: string;

  @Column({ field: "linked_document" })
  linkedDocument: string;

  @Column({ field: "zip_code" })
  zipCode: string;

  @Column
  street: string;

  @Column
  number: string;

  @Column
  complement: string;

  @Column
  district: string;

  @Column
  city: string;

  @Column
  state: string;

  @Column
  reference: string;

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

export default ClientAddress;
