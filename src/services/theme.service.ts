import { Op } from 'sequelize';
import { Theme } from '../db/models';
import logger from '../config/logger';

export interface ThemeCreationData {
  tenantId: string;
  name: string;
  description?: string;
  isDefault?: boolean;
  colors?: {
    primary?: string;
    secondary?: string;
    accent?: string;
    background?: string;
    surface?: string;
    text?: string;
    textSecondary?: string;
    border?: string;
    error?: string;
    success?: string;
    warning?: string;
    info?: string;
  };
  typography?: {
    fontFamily?: string;
    fontSize?: {
      xs?: string;
      sm?: string;
      base?: string;
      lg?: string;
      xl?: string;
      '2xl'?: string;
      '3xl'?: string;
      '4xl'?: string;
    };
    fontWeight?: {
      normal?: number;
      medium?: number;
      semibold?: number;
      bold?: number;
    };
  };
  layout?: {
    borderRadius?: string;
    spacing?: {
      xs?: string;
      sm?: string;
      md?: string;
      lg?: string;
      xl?: string;
      '2xl'?: string;
    };
    shadows?: {
      sm?: string;
      md?: string;
      lg?: string;
      xl?: string;
    };
  };
  pages?: {
    login?: {
      backgroundImage?: string | null;
      backgroundColor?: string;
      logo?: {
        size?: 'small' | 'medium' | 'large';
        position?: 'left' | 'center' | 'right';
      };
      form?: {
        width?: string;
        borderRadius?: string;
        shadow?: string;
      };
    };
    home?: {
      layout?: 'grid' | 'list' | 'cards';
      header?: {
        height?: string;
        backgroundColor?: string;
        textColor?: string;
      };
      sidebar?: {
        width?: string;
        backgroundColor?: string;
        collapsed?: boolean;
      };
      main?: {
        padding?: string;
        backgroundColor?: string;
      };
    };
    logout?: {
      showConfirmation?: boolean;
      redirectDelay?: number;
      message?: string;
    };
  };
  components?: {
    buttons?: {
      primary?: {
        backgroundColor?: string;
        textColor?: string;
        borderRadius?: string;
        padding?: string;
      };
      secondary?: {
        backgroundColor?: string;
        textColor?: string;
        borderColor?: string;
        borderRadius?: string;
        padding?: string;
      };
    };
    inputs?: {
      borderRadius?: string;
      borderColor?: string;
      focusBorderColor?: string;
      padding?: string;
    };
    cards?: {
      borderRadius?: string;
      shadow?: string;
      backgroundColor?: string;
    };
  };
  createdById: string;
}

export interface ThemeWithCreator {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  isDefault: boolean;
  isActive: boolean;
  colors: any;
  typography: any;
  layout: any;
  pages: any;
  components: any;
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | undefined;
}

export class ThemeService {
  /**
   * Create a new theme
   */
  static async createTheme(data: ThemeCreationData): Promise<Theme> {
    try {
      // If this theme is set as default, unset other defaults for this tenant
      if (data.isDefault) {
        await Theme.update(
          { isDefault: false },
          { where: { tenantId: data.tenantId, isDefault: true } }
        );
      }

      const theme = await Theme.create({
        tenantId: data.tenantId,
        name: data.name,
        description: data.description,
        isDefault: data.isDefault || false,
        isActive: true,
        colors: {
          primary: '#3B82F6',
          secondary: '#64748B',
          accent: '#F59E0B',
          background: '#FFFFFF',
          surface: '#F8FAFC',
          text: '#1E293B',
          textSecondary: '#64748B',
          border: '#E2E8F0',
          error: '#EF4444',
          success: '#10B981',
          warning: '#F59E0B',
          info: '#3B82F6',
          ...data.colors,
        },
        typography: {
          fontFamily: 'Inter, system-ui, sans-serif',
          fontSize: {
            xs: '0.75rem',
            sm: '0.875rem',
            base: '1rem',
            lg: '1.125rem',
            xl: '1.25rem',
            '2xl': '1.5rem',
            '3xl': '1.875rem',
            '4xl': '2.25rem',
          },
          fontWeight: {
            normal: 400,
            medium: 500,
            semibold: 600,
            bold: 700,
          },
          ...data.typography,
        },
        layout: {
          borderRadius: '8px',
          spacing: {
            xs: '0.25rem',
            sm: '0.5rem',
            md: '1rem',
            lg: '1.5rem',
            xl: '2rem',
            '2xl': '3rem',
          },
          shadows: {
            sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
            md: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
            lg: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
            xl: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
          },
          ...data.layout,
        },
        pages: {
          login: {
            backgroundImage: null,
            backgroundColor: '#F8FAFC',
            logo: {
              size: 'large',
              position: 'center',
            },
            form: {
              width: '400px',
              borderRadius: '12px',
              shadow: 'lg',
            },
            ...data.pages?.login,
          },
          home: {
            layout: 'grid',
            header: {
              height: '64px',
              backgroundColor: 'primary',
              textColor: 'white',
            },
            sidebar: {
              width: '240px',
              backgroundColor: 'surface',
              collapsed: false,
            },
            main: {
              padding: 'lg',
              backgroundColor: 'background',
            },
            ...data.pages?.home,
          },
          logout: {
            showConfirmation: true,
            redirectDelay: 2000,
            message: 'You have been successfully logged out.',
            ...data.pages?.logout,
          },
          ...data.pages,
        },
        components: {
          buttons: {
            primary: {
              backgroundColor: 'primary',
              textColor: 'white',
              borderRadius: 'md',
              padding: 'sm lg',
              ...data.components?.buttons?.primary,
            },
            secondary: {
              backgroundColor: 'surface',
              textColor: 'text',
              borderColor: 'border',
              borderRadius: 'md',
              padding: 'sm lg',
              ...data.components?.buttons?.secondary,
            },
            ...data.components?.buttons,
          },
          inputs: {
            borderRadius: 'md',
            borderColor: 'border',
            focusBorderColor: 'primary',
            padding: 'sm md',
            ...data.components?.inputs,
          },
          cards: {
            borderRadius: 'lg',
            shadow: 'md',
            backgroundColor: 'surface',
            ...data.components?.cards,
          },
          ...data.components,
        },
        createdById: data.createdById,
      });

      logger.info(`Created theme: ${theme.dataValues.id} for tenant: ${data.tenantId}`);
      return theme;
    } catch (error) {
      logger.error('Error creating theme:', error);
      throw new Error('Failed to create theme');
    }
  }

  /**
   * Get themes for a tenant
   */
  static async getThemes(tenantId: string, filters?: {
    isActive?: boolean;
    isDefault?: boolean;
    createdById?: string;
  }): Promise<ThemeWithCreator[]> {
    try {
      const where: any = { tenantId };

      if (filters?.isActive !== undefined) {
        where.isActive = filters.isActive;
      }

      if (filters?.isDefault !== undefined) {
        where.isDefault = filters.isDefault;
      }

      if (filters?.createdById) {
        where.createdById = filters.createdById;
      }

      const themes = await Theme.findAll({
        where,
        include: [
          {
            model: require('../db/models').User,
            as: 'createdBy',
            attributes: ['id', 'firstName', 'lastName', 'email'],
          },
        ],
        order: [
          ['isDefault', 'DESC'],
          ['createdAt', 'DESC'],
        ],
      });

      return themes.map(theme => ({
        id: theme.dataValues.id,
        tenantId: theme.dataValues.tenantId,
        name: theme.dataValues.name,
        description: theme.dataValues.description,
        isDefault: theme.dataValues.isDefault,
        isActive: theme.dataValues.isActive,
        colors: theme.dataValues.colors,
        typography: theme.dataValues.typography,
        layout: theme.dataValues.layout,
        pages: theme.dataValues.pages,
        components: theme.dataValues.components,
        createdById: theme.dataValues.createdById,
        createdAt: theme.dataValues.createdAt,
        updatedAt: theme.dataValues.updatedAt,
        createdBy: (theme as any).createdBy ? {
          id: (theme as any).createdBy.dataValues.id,
          firstName: (theme as any).createdBy.dataValues.firstName,
          lastName: (theme as any).createdBy.dataValues.lastName,
          email: (theme as any).createdBy.dataValues.email,
        } : undefined,
      })) as ThemeWithCreator[];
    } catch (error) {
      logger.error('Error getting themes:', error);
      throw new Error('Failed to get themes');
    }
  }

  /**
   * Get a specific theme
   */
  static async getTheme(themeId: string, tenantId: string): Promise<ThemeWithCreator | null> {
    try {
      const theme = await Theme.findOne({
        where: { id: themeId, tenantId },
        include: [
          {
            model: require('../db/models').User,
            as: 'createdBy',
            attributes: ['id', 'firstName', 'lastName', 'email'],
          },
        ],
      });

      if (!theme) {
        return null;
      }

      return {
        id: theme.dataValues.id,
        tenantId: theme.dataValues.tenantId,
        name: theme.dataValues.name,
        description: theme.dataValues.description,
        isDefault: theme.dataValues.isDefault,
        isActive: theme.dataValues.isActive,
        colors: theme.dataValues.colors,
        typography: theme.dataValues.typography,
        layout: theme.dataValues.layout,
        pages: theme.dataValues.pages,
        components: theme.dataValues.components,
        createdById: theme.dataValues.createdById,
        createdAt: theme.dataValues.createdAt,
        updatedAt: theme.dataValues.updatedAt,
        createdBy: (theme as any).createdBy ? {
          id: (theme as any).createdBy.dataValues.id,
          firstName: (theme as any).createdBy.dataValues.firstName,
          lastName: (theme as any).createdBy.dataValues.lastName,
          email: (theme as any).createdBy.dataValues.email,
        } : undefined,
      };
    } catch (error) {
      logger.error('Error getting theme:', error);
      throw new Error('Failed to get theme');
    }
  }

  /**
   * Get the default theme for a tenant
   */
  static async getDefaultTheme(tenantId: string): Promise<ThemeWithCreator | null> {
    try {
      const theme = await Theme.findOne({
        where: { tenantId, isDefault: true, isActive: true },
        include: [
          {
            model: require('../db/models').User,
            as: 'createdBy',
            attributes: ['id', 'firstName', 'lastName', 'email'],
          },
        ],
      });

      if (!theme) {
        return null;
      }

      return {
        id: theme.dataValues.id,
        tenantId: theme.dataValues.tenantId,
        name: theme.dataValues.name,
        description: theme.dataValues.description,
        isDefault: theme.dataValues.isDefault,
        isActive: theme.dataValues.isActive,
        colors: theme.dataValues.colors,
        typography: theme.dataValues.typography,
        layout: theme.dataValues.layout,
        pages: theme.dataValues.pages,
        components: theme.dataValues.components,
        createdById: theme.dataValues.createdById,
        createdAt: theme.dataValues.createdAt,
        updatedAt: theme.dataValues.updatedAt,
        createdBy: (theme as any).createdBy ? {
          id: (theme as any).createdBy.dataValues.id,
          firstName: (theme as any).createdBy.dataValues.firstName,
          lastName: (theme as any).createdBy.dataValues.lastName,
          email: (theme as any).createdBy.dataValues.email,
        } : undefined,
      };
    } catch (error) {
      logger.error('Error getting default theme:', error);
      throw new Error('Failed to get default theme');
    }
  }

  /**
   * Update a theme
   */
  static async updateTheme(
    themeId: string,
    tenantId: string,
    updates: Partial<ThemeCreationData>
  ): Promise<Theme> {
    try {
      const theme = await Theme.findOne({
        where: { id: themeId, tenantId },
      });

      if (!theme) {
        throw new Error('Theme not found');
      }

      // If setting as default, unset other defaults
      if (updates.isDefault) {
        await Theme.update(
          { isDefault: false },
          { where: { tenantId, isDefault: true, id: { [Op.ne]: themeId } } }
        );
      }

      const updateData: any = { ...updates };

      // Merge nested objects properly
      if (updates.colors) {
        updateData.colors = { ...theme.dataValues.colors, ...updates.colors };
      }
      if (updates.typography) {
        updateData.typography = { ...theme.dataValues.typography, ...updates.typography };
      }
      if (updates.layout) {
        updateData.layout = { ...theme.dataValues.layout, ...updates.layout };
      }
      if (updates.pages) {
        updateData.pages = {
          login: { ...theme.dataValues.pages.login, ...updates.pages.login },
          home: { ...theme.dataValues.pages.home, ...updates.pages.home },
          logout: { ...theme.dataValues.pages.logout, ...updates.pages.logout },
          ...updates.pages,
        };
      }
      if (updates.components) {
        updateData.components = {
          buttons: {
            primary: { ...theme.dataValues.components.buttons.primary, ...updates.components.buttons?.primary },
            secondary: { ...theme.dataValues.components.buttons.secondary, ...updates.components.buttons?.secondary },
            ...updates.components.buttons,
          },
          inputs: { ...theme.dataValues.components.inputs, ...updates.components.inputs },
          cards: { ...theme.dataValues.components.cards, ...updates.components.cards },
          ...updates.components,
        };
      }

      await theme.update(updateData);

      logger.info(`Updated theme: ${themeId}`);
      return theme;
    } catch (error) {
      logger.error('Error updating theme:', error);
      throw new Error('Failed to update theme');
    }
  }

  /**
   * Delete a theme
   */
  static async deleteTheme(themeId: string, tenantId: string): Promise<void> {
    try {
      const theme = await Theme.findOne({
        where: { id: themeId, tenantId },
      });

      if (!theme) {
        throw new Error('Theme not found');
      }

      if (theme.dataValues.isDefault) {
        throw new Error('Cannot delete the default theme');
      }

      const deletedCount = await Theme.destroy({
        where: { id: themeId, tenantId },
      });

      if (deletedCount === 0) {
        throw new Error('Theme not found');
      }

      logger.info(`Deleted theme: ${themeId}`);
    } catch (error) {
      logger.error('Error deleting theme:', error);
      throw new Error('Failed to delete theme');
    }
  }

  /**
   * Set a theme as default
   */
  static async setDefaultTheme(themeId: string, tenantId: string): Promise<void> {
    try {
      const theme = await Theme.findOne({
        where: { id: themeId, tenantId },
      });

      if (!theme) {
        throw new Error('Theme not found');
      }

      // Unset all other defaults
      await Theme.update(
        { isDefault: false },
        { where: { tenantId } }
      );

      // Set this theme as default
      await theme.update({ isDefault: true });

      logger.info(`Set theme as default: ${themeId} for tenant: ${tenantId}`);
    } catch (error) {
      logger.error('Error setting default theme:', error);
      throw new Error('Failed to set default theme');
    }
  }

  /**
   * Duplicate a theme
   */
  static async duplicateTheme(themeId: string, tenantId: string, newName: string, createdById: string): Promise<Theme> {
    try {
      const originalTheme = await Theme.findOne({
        where: { id: themeId, tenantId },
      });

      if (!originalTheme) {
        throw new Error('Theme not found');
      }

      const duplicatedTheme = await Theme.create({
        tenantId,
        name: newName,
        description: originalTheme.dataValues.description,
        isDefault: false,
        isActive: true,
        colors: originalTheme.dataValues.colors,
        typography: originalTheme.dataValues.typography,
        layout: originalTheme.dataValues.layout,
        pages: originalTheme.dataValues.pages,
        components: originalTheme.dataValues.components,
        createdById,
      });

      logger.info(`Duplicated theme: ${themeId} to ${duplicatedTheme.dataValues.id}`);
      return duplicatedTheme;
    } catch (error) {
      logger.error('Error duplicating theme:', error);
      throw new Error('Failed to duplicate theme');
    }
  }

  /**
   * Get theme statistics for a tenant
   */
  static async getThemeStats(tenantId: string): Promise<any> {
    try {
      const totalThemes = await Theme.count({
        where: { tenantId },
      });

      const activeThemes = await Theme.count({
        where: { tenantId, isActive: true },
      });

      const defaultTheme = await Theme.findOne({
        where: { tenantId, isDefault: true },
      });

      return {
        totalThemes,
        activeThemes,
        defaultThemeId: defaultTheme?.dataValues.id,
        defaultThemeName: defaultTheme?.dataValues.name,
      };
    } catch (error) {
      logger.error('Error getting theme stats:', error);
      throw new Error('Failed to get theme statistics');
    }
  }

  /**
   * Validate theme data
   */
  static validateThemeData(data: ThemeCreationData): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data.name || data.name.trim().length === 0) {
      errors.push('Name is required');
    }

    if (!data.tenantId) {
      errors.push('Tenant ID is required');
    }

    if (!data.createdById) {
      errors.push('Created by ID is required');
    }

    // Validate color values (basic hex color validation)
    if (data.colors) {
      const colorFields = ['primary', 'secondary', 'accent', 'background', 'surface', 'text', 'textSecondary', 'border', 'error', 'success', 'warning', 'info'];
      for (const field of colorFields) {
        const color = (data.colors as any)[field];
        if (color && !/^#[0-9A-Fa-f]{6}$/.test(color)) {
          errors.push(`${field} color must be a valid hex color (e.g., #3B82F6)`);
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Create default theme for a tenant
   */
  static async createDefaultTheme(tenantId: string, createdById: string): Promise<Theme> {
    return this.createTheme({
      tenantId,
      name: 'Default Theme',
      description: 'Default POS theme with modern design',
      isDefault: true,
      createdById,
    });
  }
}

export default ThemeService;