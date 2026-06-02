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
  BelongsTo,
  DataType
} from "sequelize-typescript";
import Contact from "./Contact";
import Tenant from "./Tenant";

@Table
class CustomerProfile extends Model<CustomerProfile> {
  @PrimaryKey @AutoIncrement @Column id: number;

  @ForeignKey(() => Tenant) @Column tenantId: number;

  @BelongsTo(() => Tenant) tenant: Tenant;

  @ForeignKey(() => Contact) @Column contactId: number;

  @BelongsTo(() => Contact) contact: Contact;

  @Column document: string;

  @Column secondaryPhone: string;

  @Column companyName: string;

  @Column(DataType.DATEONLY) birthDate: string;

  @Default("LEAD") @Column salesStatus: string;

  @Column source: string;

  @Column(DataType.TEXT) notes: string;

  @CreatedAt createdAt: Date;

  @UpdatedAt updatedAt: Date;
}

export default CustomerProfile;
