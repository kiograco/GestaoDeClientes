import {
  Table,
  Column,
  CreatedAt,
  UpdatedAt,
  Model,
  PrimaryKey,
  AutoIncrement,
  Default,
  ForeignKey,
  BelongsTo
} from "sequelize-typescript";
import Tenant from "./Tenant";
import Contact from "./Contact";

@Table
class CustomerAddress extends Model<CustomerAddress> {
  @PrimaryKey
  @AutoIncrement
  @Column
  id: number;

  @ForeignKey(() => Tenant)
  @Column
  tenantId: number;

  @BelongsTo(() => Tenant)
  tenant: Tenant;

  @ForeignKey(() => Contact)
  @Column
  contactId: number;

  @BelongsTo(() => Contact)
  contact: Contact;

  @Column label: string;

  @Column street: string;

  @Column number: string;

  @Column district: string;

  @Column city: string;

  @Column state: string;

  @Column zipCode: string;

  @Column complement: string;

  @Column reference: string;

  @Default(false)
  @Column
  isDefault: boolean;

  @CreatedAt createdAt: Date;

  @UpdatedAt updatedAt: Date;
}

export default CustomerAddress;
