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
import ServiceInventoryBatch from "./ServiceInventoryBatch";
import ServiceInventoryPestRecommendation from "./ServiceInventoryPestRecommendation";
import ProductPest from "./ProductPest";
import Tenant from "./Tenant";

@Table
class ServiceInventoryItem extends Model<ServiceInventoryItem> {
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
  sku: string;

  @Column
  activeIngredient: string;

  @Column
  chemicalGroup: string;

  @Column
  healthRegistration: string;

  @Column
  manufacturer: string;

  @Default("outro")
  @Column
  productCategory: string;

  @Column(DataType.TEXT)
  description: string;

  @Column
  unit: string;

  @Default(0)
  @Column(DataType.INTEGER)
  quantity: number;

  @Default(0)
  @Column(DataType.INTEGER)
  minQuantity: number;

  @Column(DataType.DECIMAL(12, 2))
  costPrice: number;

  @Column(DataType.DECIMAL(12, 2))
  salePrice: number;

  @Column
  internalCode: string;

  @Column
  barcode: string;

  @Default(false)
  @Column
  lotControlEnabled: boolean;

  @Default(true)
  @Column
  showLotOnOrder: boolean;

  @Default(true)
  @Column
  showLotExpirationOnOrder: boolean;

  @Default([])
  @Column(DataType.JSONB)
  diluentTypes: string[];

  @Default([])
  @Column(DataType.JSONB)
  applicationMethods: string[];

  @Default(true)
  @Column
  showApplicationMethodOnOrder: boolean;

  @Default({})
  @Column(DataType.JSONB)
  printSettings: Record<string, boolean>;

  @Default(true)
  @Column
  active: boolean;

  @HasMany(() => ServiceInventoryBatch)
  batches: ServiceInventoryBatch[];

  @HasMany(() => ServiceInventoryPestRecommendation)
  pestRecommendations: ServiceInventoryPestRecommendation[];

  @HasMany(() => ProductPest)
  productPests: ProductPest[];

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;
}

export default ServiceInventoryItem;
