import { DataTypes } from 'sequelize'
import { sequelize } from '../services/database.service.js'

export const SmallCatch = sequelize.define(
  'SmallCatch',
  {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      defaultValue: sequelize.literal("nextval('rcr_small_catch_id_seq')")
    },
    month: {
      type: DataTypes.INTEGER
    },
    released: {
      type: DataTypes.INTEGER
    },
    reportingExclude: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    noMonthRecorded: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    createdAt: {
      type: DataTypes.DATE,
      field: 'created'
    },
    updatedAt: {
      type: DataTypes.DATE,
      field: 'last_modified'
    },
    version: {
      type: DataTypes.DATE
    }
  },
  {
    sequelize,
    modelName: 'SmallCatch',
    tableName: 'rcr_small_catch',
    underscored: true
  }
)

SmallCatch.associate = (models) => {
  SmallCatch.belongsTo(models.Activity, {
    foreignKey: {
      name: 'activity_id'
    }
  })
  SmallCatch.hasMany(models.SmallCatchCount, {
    as: 'counts',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  })
}
