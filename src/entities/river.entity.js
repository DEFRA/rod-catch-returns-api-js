import { DataTypes } from 'sequelize'
import { sequelize } from '../services/database.service.js'

export const River = sequelize.define(
  'River',
  {
    internal: {
      type: DataTypes.BOOLEAN
    },
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      defaultValue: sequelize.literal("nextval('rcr_river_id_seq')")
    },
    name: {
      type: DataTypes.STRING
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
  { sequelize, modelName: 'River', tableName: 'rcr_river', underscored: true }
)
