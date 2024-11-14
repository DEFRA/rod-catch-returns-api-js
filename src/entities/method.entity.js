import { DataTypes } from 'sequelize'
import { sequelize } from '../services/database.service.js'

export const Method = sequelize.define(
  'Method',
  {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      defaultValue: sequelize.literal("nextval('rcr_method_id_seq')")
    },
    name: {
      type: DataTypes.STRING
    },
    internal: {
      type: DataTypes.BOOLEAN
    },
    createdAt: {
      type: DataTypes.DATE,
      field: 'created'
    },
    updatedAt: {
      type: DataTypes.DATE,
      field: 'last_modified'
    }
  },
  {
    sequelize,
    modelName: 'Method',
    tableName: 'rcr_method',
    underscored: true
  }
)
