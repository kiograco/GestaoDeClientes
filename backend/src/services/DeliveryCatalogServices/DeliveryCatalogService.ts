import sequelize from "../../database";
import AppError from "../../errors/AppError";
import Product from "../../models/Product";
import ProductCategory from "../../models/ProductCategory";
import ProductOption from "../../models/ProductOption";
import ProductOptionGroup from "../../models/ProductOptionGroup";

interface CategoryData {
  name: string;
  description?: string | null;
  isActive?: boolean;
}

interface OptionData {
  name: string;
  price?: number;
  available?: boolean;
}

interface OptionGroupData {
  name: string;
  required?: boolean;
  minSelections?: number;
  maxSelections?: number;
  options?: OptionData[];
}

interface ProductData {
  categoryId: number;
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  basePrice: number;
  available?: boolean;
  saleStartTime?: string | null;
  saleEndTime?: string | null;
  optionGroups?: OptionGroupData[];
}

const productInclude = [
  { model: ProductCategory, as: "category" },
  {
    model: ProductOptionGroup,
    as: "optionGroups",
    include: [{ model: ProductOption, as: "options" }]
  }
];

export const listCategories = async (
  tenantId: number
): Promise<ProductCategory[]> =>
  ProductCategory.findAll({ where: { tenantId }, order: [["name", "ASC"]] });

export const createCategory = async (
  tenantId: number,
  data: CategoryData
): Promise<ProductCategory> =>
  ProductCategory.create({
    ...data,
    name: data.name.trim(),
    tenantId
  } as LegacyAny);

export const updateCategory = async (
  tenantId: number,
  categoryId: string,
  data: CategoryData
): Promise<ProductCategory> => {
  const category = await ProductCategory.findOne({
    where: { id: categoryId, tenantId }
  });
  if (!category) throw new AppError("ERR_NO_PRODUCT_CATEGORY_FOUND", 404);

  await category.update({ ...data, name: data.name.trim() });
  return category;
};

export const deleteCategory = async (
  tenantId: number,
  categoryId: string
): Promise<void> => {
  const category = await ProductCategory.findOne({
    where: { id: categoryId, tenantId }
  });
  if (!category) throw new AppError("ERR_NO_PRODUCT_CATEGORY_FOUND", 404);

  const products = await Product.count({ where: { categoryId, tenantId } });
  if (products) throw new AppError("ERR_PRODUCT_CATEGORY_HAS_PRODUCTS", 400);
  await category.destroy();
};

export const listProducts = async (tenantId: number): Promise<Product[]> =>
  Product.findAll({
    where: { tenantId },
    include: productInclude,
    order: [["name", "ASC"]]
  });

const ensureCategory = async (
  tenantId: number,
  categoryId: number
): Promise<void> => {
  const category = await ProductCategory.findOne({
    where: { id: categoryId, tenantId }
  });
  if (!category) throw new AppError("ERR_NO_PRODUCT_CATEGORY_FOUND", 404);
};

const createOptionGroups = async (
  product: Product,
  tenantId: number,
  optionGroups: OptionGroupData[],
  transaction: LegacyAny
): Promise<void> => {
  await Promise.all(
    optionGroups.map(async groupData => {
      const group = await ProductOptionGroup.create(
        { ...groupData, productId: product.id, tenantId } as LegacyAny,
        { transaction }
      );
      if (groupData.options?.length) {
        await ProductOption.bulkCreate(
          groupData.options.map(option => ({
            ...option,
            groupId: group.id,
            tenantId
          })),
          { transaction }
        );
      }
    })
  );
};

export const createProduct = async (
  tenantId: number,
  data: ProductData
): Promise<Product> => {
  await ensureCategory(tenantId, data.categoryId);
  const { optionGroups = [], ...productData } = data;

  const product = await sequelize.transaction(async transaction => {
    const created = await Product.create(
      { ...productData, tenantId } as LegacyAny,
      { transaction }
    );
    await createOptionGroups(created, tenantId, optionGroups, transaction);
    return created;
  });

  const createdProduct = await Product.findByPk(product.id, {
    include: productInclude
  });
  return createdProduct as Product;
};

export const updateProduct = async (
  tenantId: number,
  productId: string,
  data: ProductData
): Promise<Product> => {
  await ensureCategory(tenantId, data.categoryId);
  const product = await Product.findOne({ where: { id: productId, tenantId } });
  if (!product) throw new AppError("ERR_NO_PRODUCT_FOUND", 404);
  const { optionGroups = [], ...productData } = data;

  await sequelize.transaction(async transaction => {
    await product.update(productData, { transaction });
    const groups = await ProductOptionGroup.findAll({
      where: { productId: product.id, tenantId },
      transaction
    });
    const groupIds = groups.map(group => group.id);
    if (groupIds.length) {
      await ProductOption.destroy({
        where: { groupId: groupIds, tenantId },
        transaction
      });
    }
    await ProductOptionGroup.destroy({
      where: { productId: product.id, tenantId },
      transaction
    });
    await createOptionGroups(product, tenantId, optionGroups, transaction);
  });

  const updatedProduct = await Product.findByPk(product.id, {
    include: productInclude
  });
  return updatedProduct as Product;
};

export const deleteProduct = async (
  tenantId: number,
  productId: string
): Promise<void> => {
  const product = await Product.findOne({ where: { id: productId, tenantId } });
  if (!product) throw new AppError("ERR_NO_PRODUCT_FOUND", 404);
  await product.destroy();
};
