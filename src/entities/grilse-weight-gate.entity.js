import { DataTypes } from 'sequelize'
import { sequelize } from '../services/database.service.js'

export const GrilseWeightGate = sequelize.define(
  'GrilseWeightGate',
  {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      defaultValue: sequelize.literal(
        "nextval('rcr_grilse_weight_gate_id_seq')"
      )
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
    },
    version: {
      type: DataTypes.DATE
    }
  },
  {
    sequelize,
    modelName: 'GrilseWeightGate',
    tableName: 'rcr_grilse_weight_gate',
    underscored: true
  }
)

GrilseWeightGate.associate = (models) => {
  GrilseWeightGate.hasMany(models.Catchment, {
    foreignKey: {
      name: 'gate_id'
    }
  })
  GrilseWeightGate.hasMany(models.GrilseProbability)
}
