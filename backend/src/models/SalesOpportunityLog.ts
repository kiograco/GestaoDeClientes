import {
  Table,
  Column,
  CreatedAt,
  UpdatedAt,
  Model,
  PrimaryKey,
  AutoIncrement,
  ForeignKey,
  BelongsTo,
  DataType
} from "sequelize-typescript";
import SalesOpportunity from "./SalesOpportunity";
import User from "./User";

@Table
class SalesOpportunityLog extends Model<SalesOpportunityLog> {
  @PrimaryKey
  @AutoIncrement
  @Column
  id: number;

  @ForeignKey(() => SalesOpportunity)
  @Column
  salesOpportunityId: number;

  @BelongsTo(() => SalesOpportunity)
  salesOpportunity: SalesOpportunity;

  @ForeignKey(() => User)
  @Column
  userId: string | number;

  @BelongsTo(() => User)
  user: User;

  @Column
  action: string;

  @Column(DataType.JSON)
  oldValue: Record<string, unknown>;

  @Column(DataType.JSON)
  newValue: Record<string, unknown>;

  @Column
  description: string;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;
}

export default SalesOpportunityLog;
