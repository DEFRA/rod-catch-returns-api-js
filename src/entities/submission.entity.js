import { SOURCES, STATUSES } from '../utils/constants.js'
import { DataTypes } from 'sequelize'
import { sequelize } from '../services/database.service.js'

export const Submission = sequelize.define(
  'Submission',
  {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      defaultValue: sequelize.literal("nextval('rcr_submission_id_seq')")
    },
    contactId: {
      type: DataTypes.STRING
    },
    season: {
      type: DataTypes.INTEGER
    },
    status: {
      type: DataTypes.ENUM(Object.values(STATUSES))
    },
    source: {
      type: DataTypes.ENUM(Object.values(SOURCES))
    },
    reportingExclude: {
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
    modelName: 'Submission',
    tableName: 'rcr_submission',
    underscored: true
  }
)

Submission.associate = (models) => {
  Submission.hasMany(models.Activity, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  })
}
