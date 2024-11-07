import { DataTypes } from 'sequelize'
import { sequelize } from '../services/database.service.js'

export const Activity = sequelize.define(
  'Activity',
  {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      defaultValue: sequelize.literal("nextval('rcr_activity_id_seq')")
    },
    daysFishedWithMandatoryRelease: {
      type: DataTypes.INTEGER
    },
    daysFishedOther: {
      type: DataTypes.INTEGER
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
    modelName: 'Activity',
    tableName: 'rcr_activity',
    underscored: true
  }
)

Activity.associate = (models) => {
  Activity.belongsTo(models.Submission, {
    foreignKey: 'submission_id'
  })

  Activity.belongsTo(models.River, {
    foreignKey: 'river_id'
  })

  Activity.hasMany(models.SmallCatch, {})
}
