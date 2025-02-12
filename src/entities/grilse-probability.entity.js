import { DataTypes } from 'sequelize'
import { sequelize } from '../services/database.service.js'

export const GrilseProbability = sequelize.define(
  'GrilseProbability',
  {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      defaultValue: sequelize.literal(
        "nextval('rcr_grilse_probability_id_seq')"
      )
    },
    season: {
      type: DataTypes.INTEGER // The season the probability data relates to
    },
    month: {
      type: DataTypes.INTEGER // The month (1-based index) this probability data relates to
    },
    massInPounds: {
      type: DataTypes.INTEGER, // The mass associated with this probability (in imperial pounds, data matched to the nearest whole pound)
      field: 'mass_lbs'
    },
    probability: {
      type: DataTypes.FLOAT // The probability entry (decimal between 0 and 1)
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
    modelName: 'GrilseProbability',
    tableName: 'rcr_grilse_probability',
    underscored: true
  }
)

GrilseProbability.associate = (models) => {
  GrilseProbability.belongsTo(models.GrilseWeightGate, {
    foreignKey: {
      name: 'gate_id' // The grilse weight gate that the probability relates to
    }
  })
}
