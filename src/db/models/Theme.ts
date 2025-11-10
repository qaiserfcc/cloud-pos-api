import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from './index';

class Theme extends Model {
  // Association mixins
  readonly tenant?: any;
  readonly createdBy?: any;
}

Theme.init(
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    tenantId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'tenants',
        key: 'id',
      },
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    isDefault: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    // Color scheme
    colors: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {
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
        info: '#3B82F6'
      },
    },
    // Typography settings
    typography: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {
        fontFamily: 'Inter, system-ui, sans-serif',
        fontSize: {
          xs: '0.75rem',
          sm: '0.875rem',
          base: '1rem',
          lg: '1.125rem',
          xl: '1.25rem',
          '2xl': '1.5rem',
          '3xl': '1.875rem',
          '4xl': '2.25rem'
        },
        fontWeight: {
          normal: 400,
          medium: 500,
          semibold: 600,
          bold: 700
        }
      },
    },
    // Layout configurations
    layout: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {
        borderRadius: '8px',
        spacing: {
          xs: '0.25rem',
          sm: '0.5rem',
          md: '1rem',
          lg: '1.5rem',
          xl: '2rem',
          '2xl': '3rem'
        },
        shadows: {
          sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
          md: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
          lg: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
          xl: '0 20px 25px -5px rgb(0 0 0 / 0.1)'
        }
      },
    },
    // Page-specific configurations
    pages: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {
        login: {
          backgroundImage: null,
          backgroundColor: '#F8FAFC',
          logo: {
            size: 'large',
            position: 'center'
          },
          form: {
            width: '400px',
            borderRadius: '12px',
            shadow: 'lg'
          }
        },
        home: {
          layout: 'grid',
          header: {
            height: '64px',
            backgroundColor: 'primary',
            textColor: 'white'
          },
          sidebar: {
            width: '240px',
            backgroundColor: 'surface',
            collapsed: false
          },
          main: {
            padding: 'lg',
            backgroundColor: 'background'
          }
        },
        logout: {
          showConfirmation: true,
          redirectDelay: 2000,
          message: 'You have been successfully logged out.'
        }
      },
    },
    // Component overrides
    components: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {
        buttons: {
          primary: {
            backgroundColor: 'primary',
            textColor: 'white',
            borderRadius: 'md',
            padding: 'sm lg'
          },
          secondary: {
            backgroundColor: 'surface',
            textColor: 'text',
            borderColor: 'border',
            borderRadius: 'md',
            padding: 'sm lg'
          }
        },
        inputs: {
          borderRadius: 'md',
          borderColor: 'border',
          focusBorderColor: 'primary',
          padding: 'sm md'
        },
        cards: {
          borderRadius: 'lg',
          shadow: 'md',
          backgroundColor: 'surface'
        }
      },
    },
    createdById: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    modelName: 'Theme',
    tableName: 'themes',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['tenant_id'],
      },
      {
        fields: ['is_default'],
      },
      {
        fields: ['is_active'],
      },
      {
        fields: ['created_by_id'],
      },
      {
        unique: true,
        fields: ['tenant_id', 'name'],
      },
    ],
  }
);

export default Theme;