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
import Client from "./Client";

@Table({ tableName: "ClientUnits", paranoid: true })
class ClientUnit extends Model<ClientUnit> {
  @PrimaryKey
  @AutoIncrement
  @Column
  id: number;

  @ForeignKey(() => Tenant)
  @Column
  tenantId: number;

  @BelongsTo(() => Tenant)
  tenant: Tenant;

  @ForeignKey(() => Client)
  @Column
  clientId: number;

  @BelongsTo(() => Client)
  client: Client;

  @Column
  code: string;

  @Column
  name: string;

  @Column
  responsibleName: string;

  @Column
  phone: string;

  @Column
  email: string;

  @Column
  zipCode: string;

  @Column
  street: string;

  @Column
  number: string;

  @Column
  complement: string;

  @Column
  neighborhood: string;

  @Column
  city: string;

  @Column
  state: string;

  @Column(DataType.DECIMAL(10, 7))
  latitude: number;

  @Column(DataType.DECIMAL(10, 7))
  longitude: number;

  @Default("active")
  @Column
  status: string;

  @Column(DataType.TEXT)
  observations: string;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;

  @DeletedAt
  deletedAt: Date;
}

export default ClientUnit;
