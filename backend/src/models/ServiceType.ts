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
  HasMany,
  DataType
} from "sequelize-typescript";
import Tenant from "./Tenant";
import ServiceEnvironment from "./ServiceEnvironment";
import ServiceMethod from "./ServiceMethod";
import ServicePest from "./ServicePest";
import ServiceProduct from "./ServiceProduct";
import ServiceWarranty from "./ServiceWarranty";

@Table
class ServiceType extends Model<ServiceType> {
  @PrimaryKey
  @AutoIncrement
  @Column
  id: number;

  @ForeignKey(() => Tenant)
  @Column
  tenantId: number;

  @BelongsTo(() => Tenant)
  tenant: Tenant;

  @Column
  name: string;

  @Column
  code: string;

  @Column(DataType.TEXT)
  description: string;

  @Column(DataType.TEXT)
  technicalDescription: string;

  @Column(DataType.DECIMAL(12, 2))
  defaultPrice: number;

  @Default([])
  @Column(DataType.JSONB)
  categories: string[];

  @Column
  averageExecutionTime: string;

  @Default(1)
  @Column(DataType.INTEGER)
  recommendedTechnicians: number;

  @Default(false)
  @Column
  needsReturn: boolean;

  @Default(0)
  @Column(DataType.INTEGER)
  returnQuantity: number;

  @Column
  returnInterval: string;

  @Column(DataType.TEXT)
  orderDefaultText: string;

  @Column(DataType.TEXT)
  customerRecommendations: string;

  @Column(DataType.TEXT)
  internalObservation: string;

  @Default(true)
  @Column
  active: boolean;

  @HasMany(() => ServicePest)
  pests: ServicePest[];

  @HasMany(() => ServiceEnvironment)
  environments: ServiceEnvironment[];

  @HasMany(() => ServiceMethod)
  methods: ServiceMethod[];

  @HasMany(() => ServiceProduct)
  products: ServiceProduct[];

  @HasMany(() => ServiceWarranty)
  warranties: ServiceWarranty[];

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;
}

export default ServiceType;
