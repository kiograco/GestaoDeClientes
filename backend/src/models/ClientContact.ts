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
import ClientAddress from "./ClientAddress";

@Table({ tableName: "client_contacts", paranoid: true })
class ClientContact extends Model<ClientContact> {
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

  @Column
  role: string;

  @Column
  phone: string;

  @Column
  whatsapp: string;

  @Column
  email: string;

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

export default ClientContact;
