import { Product, Inventory, SaleItem } from '../db/models';
import { Op } from 'sequelize';
import logger from '../config/logger';

export interface CreateProductData {
  tenantId: string;
  storeId?: string;
  name: string;
  description?: string;
  sku?: string;
  barcode?: string;
  metadata?: any;
}

export interface UpdateProductData {
  name?: string;
  description?: string;
  sku?: string;
  barcode?: string;
  metadata?: any;
}

export interface ProductWithAssociations {
  id: string;
  tenantId: string;
  storeId?: string | undefined;
  name: string;
  description?: string | undefined;
  sku?: string | undefined;
  barcode?: string | undefined;
  metadata?: any;
  version: number;
  createdAt: Date;
  updatedAt: Date;
  inventory?: Inventory[];
}

export class ProductService {
  /**
   * Get all products for a tenant
   */
  static async getAllProducts(tenantId: string, storeId?: string, filters?: any): Promise<ProductWithAssociations[]> {
    try {
      const whereClause: any = { tenantId };

      if (storeId) {
        whereClause.storeId = storeId;
      }

      if (filters) {
        if (filters.name) {
          whereClause.name = { [Op.iLike]: `%${filters.name}%` };
        }
        if (filters.sku) {
          whereClause.sku = { [Op.iLike]: `%${filters.sku}%` };
        }
        if (filters.barcode) {
          whereClause.barcode = filters.barcode;
        }
      }

      const products = await Product.findAll({
        where: whereClause,
        include: [
          {
            model: Inventory,
            as: 'inventories',
            required: false,
          },
        ],
        order: [['createdAt', 'DESC']],
      });

      return products.map(product => ({
        id: product.id,
        tenantId: product.tenantId,
        storeId: product.storeId,
        name: product.name,
        description: product.description,
        sku: product.sku,
        barcode: product.barcode,
        metadata: product.metadata,
        version: product.version,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
        inventory: (product as any).inventories,
      }));
    } catch (error) {
      logger.error('Error getting all products:', error);
      throw new Error('Failed to retrieve products');
    }
  }

  /**
   * Get product by ID
   */
  static async getProductById(productId: string, tenantId: string): Promise<ProductWithAssociations | null> {
    try {
      const product = await Product.findOne({
        where: { id: productId, tenantId },
        include: [
          {
            model: Inventory,
            as: 'inventories',
            required: false,
          },
        ],
      });

      if (!product) {
        return null;
      }

      return {
        id: product.id,
        tenantId: product.tenantId,
        storeId: product.storeId,
        name: product.name,
        description: product.description,
        sku: product.sku,
        barcode: product.barcode,
        metadata: product.metadata,
        version: product.version,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
        inventory: (product as any).inventories,
      };
    } catch (error) {
      logger.error('Error getting product by ID:', error);
      throw new Error('Failed to retrieve product');
    }
  }

  /**
   * Create a new product
   */
  static async createProduct(productData: CreateProductData): Promise<ProductWithAssociations> {
    try {
      const createData: any = {
        ...productData,
        version: 1,
      };

      const product = await Product.create(createData);
      logger.info(`Product created: ${product.id}`);
      const result = await this.getProductById(product.id, productData.tenantId);
      return result!;
    } catch (error: any) {
      logger.error('Error creating product:', error);

      if (error.name === 'SequelizeUniqueConstraintError') {
        if (error.errors.some((e: any) => e.path === 'sku')) {
          throw new Error('Product SKU already exists');
        }
        if (error.errors.some((e: any) => e.path === 'barcode')) {
          throw new Error('Product barcode already exists');
        }
      }

      throw new Error('Failed to create product');
    }
  }

  /**
   * Update product
   */
  static async updateProduct(productId: string, tenantId: string, updateData: UpdateProductData): Promise<ProductWithAssociations | null> {
    try {
      const [affectedRows] = await Product.update(updateData, {
        where: { id: productId, tenantId },
      });

      if (affectedRows === 0) {
        return null;
      }

      const updatedProduct = await this.getProductById(productId, tenantId);
      logger.info(`Product updated: ${productId}`);
      return updatedProduct;
    } catch (error: any) {
      logger.error('Error updating product:', error);

      if (error.name === 'SequelizeUniqueConstraintError') {
        if (error.errors.some((e: any) => e.path === 'sku')) {
          throw new Error('Product SKU already exists');
        }
        if (error.errors.some((e: any) => e.path === 'barcode')) {
          throw new Error('Product barcode already exists');
        }
      }

      throw new Error('Failed to update product');
    }
  }

  /**
   * Delete product
   */
  static async deleteProduct(productId: string, tenantId: string): Promise<boolean> {
    try {
      // Check if product has sale items
      const saleItemCount = await SaleItem.count({
        where: { productId },
      });

      if (saleItemCount > 0) {
        throw new Error('Cannot delete product with existing sales');
      }

      const deletedRows = await Product.destroy({
        where: { id: productId, tenantId },
      });

      if (deletedRows > 0) {
        logger.info(`Product deleted: ${productId}`);
        return true;
      }

      return false;
    } catch (error: any) {
      logger.error('Error deleting product:', error);
      throw error;
    }
  }

  /**
   * Search products
   */
  static async searchProducts(tenantId: string, query: string, storeId?: string): Promise<ProductWithAssociations[]> {
    try {
      const whereClause: any = {
        tenantId,
        [Op.or]: [
          { name: { [Op.iLike]: `%${query}%` } },
          { sku: { [Op.iLike]: `%${query}%` } },
          { barcode: { [Op.iLike]: `%${query}%` } },
          { description: { [Op.iLike]: `%${query}%` } },
        ],
      };

      if (storeId) {
        whereClause.storeId = storeId;
      }

      const products = await Product.findAll({
        where: whereClause,
        include: [
          {
            model: Inventory,
            as: 'inventories',
            required: false,
          },
        ],
        order: [['name', 'ASC']],
        limit: 50,
      });

      return products.map(product => ({
        id: product.id,
        tenantId: product.tenantId,
        storeId: product.storeId,
        name: product.name,
        description: product.description,
        sku: product.sku,
        barcode: product.barcode,
        metadata: product.metadata,
        version: product.version,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
        inventory: (product as any).inventories,
      }));
    } catch (error) {
      logger.error('Error searching products:', error);
      throw new Error('Failed to search products');
    }
  }

  /**
   * Get product statistics
   */
  static async getProductStats(tenantId: string, storeId?: string): Promise<any> {
    try {
      const whereClause: any = { tenantId };

      if (storeId) {
        whereClause.storeId = storeId;
      }

      const totalProducts = await Product.count({ where: whereClause });

      return {
        totalProducts,
      };
    } catch (error) {
      logger.error('Error getting product stats:', error);
      throw new Error('Failed to get product statistics');
    }
  }
}