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
  HasMany,
  DataType
} from "sequelize-typescript";
import Tenant from "./Tenant";
import ClientAddress from "./ClientAddress";
import ClientContact from "./ClientContact";

@Table({ tableName: "clients", paranoid: true })
class Client extends Model<Client> {
  @PrimaryKey
  @AutoIncrement
  @Column
  id: number;

  @ForeignKey(() => Tenant)
  @Column({ field: "tenant_id" })
  tenantId: number;

  @BelongsTo(() => Tenant)
  tenant: Tenant;

  @Column({ field: "registration_type" })
  registrationType: string;

  @Column({ field: "legal_name" })
  legalName: string;

  @Column({ field: "trade_name" })
  tradeName: string;

  @Column
  document: string;

  @Column({ field: "state_registration" })
  stateRegistration: string;

  @Column({ field: "municipal_registration" })
  municipalRegistration: string;

  @Column({ field: "activity_sector" })
  activitySector: string;

  @Default("prospect")
  @Column
  status: string;

  @Column(DataType.TEXT)
  notes: string;

  @HasMany(() => ClientAddress)
  addresses: ClientAddress[];

  @HasMany(() => ClientContact)
  contacts: ClientContact[];

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

export default Client;
