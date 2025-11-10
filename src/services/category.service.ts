import { Category } from '../db/models';
import { Op } from 'sequelize';
import logger from '../config/logger';

export interface CreateCategoryData {
  tenantId: string;
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  sortOrder?: number;
  isActive?: boolean;
  parentId?: string;
}

export interface UpdateCategoryData {
  name?: string;
  description?: string;
  color?: string;
  icon?: string;
  sortOrder?: number;
  isActive?: boolean;
  parentId?: string;
}

export interface CategoryWithAssociations {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  sortOrder: number;
  isActive: boolean;
  parentId?: string;
  parent?: CategoryWithAssociations | undefined;
  subcategories?: CategoryWithAssociations[] | undefined;
  productsCount?: number | undefined;
  createdAt: Date;
  updatedAt: Date;
}

export class CategoryService {
  /**
   * Get all categories for a tenant (hierarchical)
   */
  static async getAllCategories(tenantId: string, includeInactive: boolean = false): Promise<CategoryWithAssociations[]> {
    try {
      const whereClause: any = { tenantId };

      if (!includeInactive) {
        whereClause.isActive = true;
      }

      const categories = await Category.findAll({
        where: whereClause,
        include: [
          {
            model: Category,
            as: 'parent',
            required: false,
          },
          {
            model: Category,
            as: 'subcategories',
            where: includeInactive ? {} : { isActive: true },
            required: false,
          },
        ],
        order: [
          ['sortOrder', 'ASC'],
          ['name', 'ASC'],
        ],
      });

      // Build hierarchical structure
      const categoryMap = new Map<string, CategoryWithAssociations>();
      const rootCategories: CategoryWithAssociations[] = [];

      // First pass: create all category objects
      categories.forEach(category => {
        const categoryData: CategoryWithAssociations = {
          id: category.id,
          tenantId: category.tenantId,
          name: category.name,
          description: category.description,
          color: category.color,
          icon: category.icon,
          sortOrder: category.sortOrder,
          isActive: category.isActive,
          parentId: category.parentId,
          parent: undefined,
          subcategories: [],
          createdAt: category.createdAt,
          updatedAt: category.updatedAt,
        } as CategoryWithAssociations;
        categoryMap.set(category.id, categoryData);
      });

      // Second pass: build hierarchy
      categories.forEach(category => {
        const categoryData = categoryMap.get(category.id)!;

        if (category.parentId) {
          const parent = categoryMap.get(category.parentId);
          if (parent) {
            categoryData.parent = parent;
            if (!parent.subcategories) parent.subcategories = [];
            parent.subcategories.push(categoryData);
          }
        } else {
          rootCategories.push(categoryData);
        }
      });

      return rootCategories;
    } catch (error) {
      logger.error('Error getting all categories:', error);
      throw new Error('Failed to retrieve categories');
    }
  }

  /**
   * Get category by ID with full hierarchy
   */
  static async getCategoryById(categoryId: string, tenantId: string): Promise<CategoryWithAssociations | null> {
    try {
      const category = await Category.findOne({
        where: { id: categoryId, tenantId },
        include: [
          {
            model: Category,
            as: 'parent',
            required: false,
          },
          {
            model: Category,
            as: 'subcategories',
            required: false,
          },
        ],
      });

      if (!category) {
        return null;
      }

      return {
        id: category.id,
        tenantId: category.tenantId,
        name: category.name,
        description: category.description,
        color: category.color,
        icon: category.icon,
        sortOrder: category.sortOrder,
        isActive: category.isActive,
        parentId: category.parentId,
        parent: category.parent ? {
          id: category.parent.id,
          tenantId: category.parent.tenantId,
          name: category.parent.name,
          description: category.parent.description,
          color: category.parent.color,
          icon: category.parent.icon,
          sortOrder: category.parent.sortOrder,
          isActive: category.parent.isActive,
          parentId: category.parent.parentId,
          createdAt: category.parent.createdAt,
          updatedAt: category.parent.updatedAt,
        } : undefined,
        subcategories: category.subcategories?.map(sub => ({
          id: sub.id,
          tenantId: sub.tenantId,
          name: sub.name,
          description: sub.description,
          color: sub.color,
          icon: sub.icon,
          sortOrder: sub.sortOrder,
          isActive: sub.isActive,
          parentId: sub.parentId,
          createdAt: sub.createdAt,
          updatedAt: sub.updatedAt,
        })) || [],
        createdAt: category.createdAt,
        updatedAt: category.updatedAt,
      } as CategoryWithAssociations;
    } catch (error) {
      logger.error('Error getting category by ID:', error);
      throw new Error('Failed to retrieve category');
    }
  }

  /**
   * Create a new category
   */
  static async createCategory(categoryData: CreateCategoryData): Promise<CategoryWithAssociations> {
    try {
      // Validate parent category exists and belongs to same tenant
      if (categoryData.parentId) {
        const parentCategory = await Category.findOne({
          where: { id: categoryData.parentId, tenantId: categoryData.tenantId },
        });

        if (!parentCategory) {
          throw new Error('Parent category not found');
        }

        // Prevent circular references
        if (parentCategory.parentId === categoryData.parentId) {
          throw new Error('Circular reference detected in category hierarchy');
        }
      }

      // Set default sort order if not provided
      if (categoryData.sortOrder === undefined) {
        const maxSortOrder = await Category.max('sortOrder', {
          where: { tenantId: categoryData.tenantId },
        });
        categoryData.sortOrder = (maxSortOrder as number || 0) + 1;
      }

      const createData: any = {
        ...categoryData,
        isActive: categoryData.isActive !== undefined ? categoryData.isActive : true,
      };

      const category = await Category.create(createData);
      logger.info(`Category created: ${category.id}`);
      const result = await this.getCategoryById(category.id, categoryData.tenantId);
      return result!;
    } catch (error: any) {
      logger.error('Error creating category:', error);

      if (error.name === 'SequelizeUniqueConstraintError') {
        throw new Error('Category name already exists');
      }

      throw error;
    }
  }

  /**
   * Update category
   */
  static async updateCategory(categoryId: string, tenantId: string, updateData: UpdateCategoryData): Promise<CategoryWithAssociations | null> {
    try {
      // Validate parent category if being updated
      if (updateData.parentId) {
        const parentCategory = await Category.findOne({
          where: { id: updateData.parentId, tenantId },
        });

        if (!parentCategory) {
          throw new Error('Parent category not found');
        }

        // Prevent circular references
        if (parentCategory.parentId === updateData.parentId) {
          throw new Error('Circular reference detected in category hierarchy');
        }
      }

      const [affectedRows] = await Category.update(updateData, {
        where: { id: categoryId, tenantId },
      });

      if (affectedRows === 0) {
        return null;
      }

      const updatedCategory = await this.getCategoryById(categoryId, tenantId);
      logger.info(`Category updated: ${categoryId}`);
      return updatedCategory;
    } catch (error: any) {
      logger.error('Error updating category:', error);

      if (error.name === 'SequelizeUniqueConstraintError') {
        throw new Error('Category name already exists');
      }

      throw error;
    }
  }

  /**
   * Delete category
   */
  static async deleteCategory(categoryId: string, tenantId: string): Promise<boolean> {
    try {
      // Check if category has subcategories
      const subcategoryCount = await Category.count({
        where: { parentId: categoryId },
      });

      if (subcategoryCount > 0) {
        throw new Error('Cannot delete category with subcategories');
      }

      const deletedRows = await Category.destroy({
        where: { id: categoryId, tenantId },
      });

      if (deletedRows > 0) {
        logger.info(`Category deleted: ${categoryId}`);
        return true;
      }

      return false;
    } catch (error: any) {
      logger.error('Error deleting category:', error);
      throw error;
    }
  }

  /**
   * Search categories
   */
  static async searchCategories(tenantId: string, query: string): Promise<CategoryWithAssociations[]> {
    try {
      const categories = await Category.findAll({
        where: {
          tenantId,
          isActive: true,
          [Op.or]: [
            { name: { [Op.iLike]: `%${query}%` } },
            { description: { [Op.iLike]: `%${query}%` } },
          ],
        },
        include: [
          {
            model: Category,
            as: 'parent',
            required: false,
          },
        ],
        order: [['sortOrder', 'ASC'], ['name', 'ASC']],
        limit: 50,
      });

      return categories.map(category => ({
        id: category.id,
        tenantId: category.tenantId,
        name: category.name,
        description: category.description,
        color: category.color,
        icon: category.icon,
        sortOrder: category.sortOrder,
        isActive: category.isActive,
        parentId: category.parentId,
        parent: category.parent ? {
          id: category.parent.id,
          tenantId: category.parent.tenantId,
          name: category.parent.name,
          description: category.parent.description,
          color: category.parent.color,
          icon: category.parent.icon,
          sortOrder: category.parent.sortOrder,
          isActive: category.parent.isActive,
          parentId: category.parent.parentId,
          createdAt: category.parent.createdAt,
          updatedAt: category.parent.updatedAt,
        } : undefined,
        createdAt: category.createdAt,
        updatedAt: category.updatedAt,
      })) as CategoryWithAssociations[];
    } catch (error) {
      logger.error('Error searching categories:', error);
      throw new Error('Failed to search categories');
    }
  }

  /**
   * Update category sort orders
   */
  static async updateCategorySortOrders(tenantId: string, categoryOrders: { id: string; sortOrder: number }[]): Promise<void> {
    try {
      const transaction = await Category.sequelize!.transaction();

      try {
        for (const { id, sortOrder } of categoryOrders) {
          await Category.update(
            { sortOrder },
            {
              where: { id, tenantId },
              transaction,
            }
          );
        }

        await transaction.commit();
        logger.info(`Updated sort orders for ${categoryOrders.length} categories`);
      } catch (error) {
        await transaction.rollback();
        throw error;
      }
    } catch (error) {
      logger.error('Error updating category sort orders:', error);
      throw new Error('Failed to update category sort orders');
    }
  }

  /**
   * Get category statistics
   */
  static async getCategoryStats(tenantId: string): Promise<any> {
    try {
      const totalCategories = await Category.count({
        where: { tenantId, isActive: true },
      });

      const rootCategories = await Category.count({
        where: { tenantId, parentId: null as any, isActive: true },
      });

      return {
        totalCategories,
        rootCategories,
      };
    } catch (error) {
      logger.error('Error getting category stats:', error);
      throw new Error('Failed to get category statistics');
    }
  }
}