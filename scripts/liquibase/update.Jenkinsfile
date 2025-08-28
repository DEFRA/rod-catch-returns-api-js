#!/usr/bin/env groovy
def utils

pipeline {
    agent any

    environment {
        IMAGE_NAME = 'defra/rod-catch-returns-liquibase-migrator'
        TAG = 'latest'
    }

    stages {
        stage('Preparing') {
            steps {
                withFolderProperties {
                    script {
                        SETTINGS = [:]
                        SETTINGS.ENVIRONMENT = env.ENVIRONMENT
                        SETTINGS.LOCATION = env.LOCATION
                        SETTINGS.SERVICE_CODE = env.SERVICE_CODE
                        SETTINGS.PARAM_SECRET_PREFIX = "/${SETTINGS.ENVIRONMENT}/${SETTINGS.LOCATION}/${SETTINGS.SERVICE_CODE}/webops/".toLowerCase()
                        SETTINGS.ACCOUNT_ID = env.ACCOUNT_ID
                        SETTINGS.ROLE_NAME = env.ROLE_NAME
                        echo "Running with settings: ${SETTINGS}"

                    }
                }
            }
        }
        stage('Build Liquibase Image') {
            steps {
                script {
                    utils = load "scripts/liquibase/utils.groovy"
                    def buildArgs = "-f Dockerfile.migrate . --no-cache"
                    docker.build("${IMAGE_NAME}:${TAG}", buildArgs)
                   
                }
            }
        }

        stage('Update Database') {
            steps {
                script {
                    utils.runLiquibaseAction("update-and-tag")
                }
            }
        }
    }

    post {
        cleanup {
            cleanWs cleanWhenFailure: true
        }
    }
}
