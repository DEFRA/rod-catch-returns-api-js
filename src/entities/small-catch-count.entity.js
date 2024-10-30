import { DataTypes } from 'sequelize'
import { sequelize } from '../services/database.service.js'

export const SmallCatchCount = sequelize.define(
  'SmallCatchCount',
  {
    small_catch_id: {
      type: DataTypes.BIGINT,
      primaryKey: true, // Small catch count doesn't have an id, but sequelize expects it. Instead a composite primary key has been used
      references: {
        model: 'rcr_small_catch',
        key: 'id'
      }
    },
    method_id: {
      type: DataTypes.BIGINT,
      primaryKey: true, // Part of composite primary key
      references: {
        model: 'rcr_method',
        key: 'id'
      }
    },
    count: {
      type: DataTypes.INTEGER
    }
  },
  {
    sequelize,
    modelName: 'SmallCatchCount',
    tableName: 'rcr_small_catch_counts',
    underscored: true,
    timestamps: false,
    primaryKey: false
  }
)

SmallCatchCount.associate = (models) => {
  SmallCatchCount.belongsTo(models.SmallCatch, {
    foreignKey: {
      name: 'small_catch_id'
    }
  })
  SmallCatchCount.belongsTo(models.Method, {
    foreignKey: {
      name: 'method_id'
    }
  })
}
