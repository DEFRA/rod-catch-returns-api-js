#!/bin/sh

export FULL_URL="jdbc:postgresql://$DATABASE_HOST:$DATABASE_PORT/$DATABASE_NAME"

liquibase_base_cmd="liquibase \
  --url=$FULL_URL \
  --username=$DATABASE_USERNAME \
  --password=$DATABASE_PASSWORD \
  --defaultSchemaName=public \
  --log-level=SEVERE \
  --changeLogFile=db/changelog/db.changelog-master.xml"

if [ "$ACTION" = "update-and-tag" ]; then
  echo "Running Liquibase update..."
  $liquibase_base_cmd update

  DATE_TAG=$(date -u +"%Y%m%d-%H%M%S")
  echo "Tagging database with: $DATE_TAG"
  $liquibase_base_cmd tag $DATE_TAG
else
  echo "Running Liquibase with action: $ACTION"
  eval "$liquibase_base_cmd $ACTION"
fi

