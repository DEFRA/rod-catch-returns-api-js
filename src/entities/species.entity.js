import { DataTypes } from 'sequelize'
import { sequelize } from '../services/database.service.js'

export const Species = sequelize.define(
  'Species',
  {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      defaultValue: sequelize.literal("nextval('rcr_species_id_seq')")
    },
    name: {
      type: DataTypes.STRING
    },
    smallCatchMass: {
      type: DataTypes.DECIMAL
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
  { sequelize, modelName: 'Species', tableName: 'rcr_species', underscored: true }
)
