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
  HasMany
} from "sequelize-typescript";
import City from "./City";

@Table({ tableName: "States", paranoid: true })
class State extends Model<State> {
  @PrimaryKey
  @AutoIncrement
  @Column
  id: number;

  @Column
  ibgeCode: number;

  @Column
  uf: string;

  @Column
  name: string;

  @Default("active")
  @Column
  status: string;

  @HasMany(() => City)
  cities: City[];

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;

  @DeletedAt
  deletedAt: Date;
}

export default State;
