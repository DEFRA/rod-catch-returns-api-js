import { DataTypes } from 'sequelize'
import { sequelize } from '../services/database.service.js'

export const Region = sequelize.define(
  'Region',
  {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      defaultValue: sequelize.literal("nextval('rcr_region_id_seq')")
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
    modelName: 'Region',
    tableName: 'rcr_region',
    underscored: true
  }
)

Region.associate = (models) => {
  Region.hasMany(models.Catchment, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  })
}
