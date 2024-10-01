import { DataTypes } from 'sequelize'
import { sequelize } from '../services/database.service.js'

export const Catchment = sequelize.define(
  'River',
  {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      defaultValue: sequelize.literal("nextval('rcr_catchment_id_seq')")
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
  {
    sequelize,
    modelName: 'Catchment',
    tableName: 'rcr_catchment',
    underscored: true
  }
)
