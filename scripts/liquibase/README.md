# Docker Liquibase Pipelines

This folder contains pipelines to manage a relational database via liquibase.

## Pipeline Guidance

### init.Jenkinsfile

This pipeline is designed to be run only once when initially setting up the database.
It will ensure that the database instances is completely clean (dropping all data) and will
then create a liquibase rollback tag named "empty".
This tag can then be used by the rollback job to reset to an empty database and test the validity
of the rollback statements defined in your project's liquibase changeset.

> **WARNING: This job will completely destroy all data stored in the target database. This should only ever be run once
> in production and then disabled permanently**!

### update.Jenkinsfile

This pipeline is designed to allow you to update the database schema. When the database has been migrated by this job, a new tag is written to the liquibase changelog to create a new rollback point.

### rollback.Jenkinsfile

This pipeline allows the database to be rolled back to any available tag recorded in the database changelog history.

> **WARNING: This job is potentially destructive and must only be run in a production environment with extreme care!**

## Environment variables

This pipeline is completely driven via environment variables as per the following example.

TODO update this

```dotenv
DATABASE_HOST=db.eu-west-1.rds.amazonaws.com
DATABASE_PORT=5432
DATABASE_NAME=db_name
DATABASE_USERNAME=db_username
DATABASE_PASSWORD=db_password
```
