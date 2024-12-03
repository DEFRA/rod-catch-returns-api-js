import { DataTypes } from 'sequelize'
import { sequelize } from '../services/database.service.js'

export const Catch = sequelize.define(
  'Catch',
  {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      defaultValue: sequelize.literal("nextval('rcr_catch_id_seq')")
    },
    dateCaught: {
      type: DataTypes.DATE
    },
    massKg: {
      type: DataTypes.FLOAT,
      field: 'mass_kg'
    },
    massOz: {
      type: DataTypes.FLOAT,
      field: 'mass_oz'
    },
    massType: {
      type: DataTypes.STRING,
      field: 'mass_type'
    },
    released: {
      type: DataTypes.BOOLEAN
    },
    onlyMonthRecorded: {
      type: DataTypes.BOOLEAN
    },
    noDateRecorded: {
      type: DataTypes.BOOLEAN
    },
    reportingExclude: {
      type: DataTypes.BOOLEAN
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
    modelName: 'Catch',
    tableName: 'rcr_catch',
    underscored: true
  }
)

Catch.associate = (models) => {
  Catch.belongsTo(models.Activity, {
    foreignKey: {
      name: 'activity_id'
    }
  })
  Catch.belongsTo(models.Method, {
    foreignKey: {
      name: 'method_id'
    }
  })
  Catch.belongsTo(models.Species, {
    foreignKey: {
      name: 'species_id'
    }
  })
}
