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
                        utils = load "scripts/liquibase/utils.groovy"
                        SETTINGS = utils.loadAWSSettings(env)
                        echo "Running with settings: ${SETTINGS}"
                    }
                }
            }
        }
        stage('Build Liquibase Image') {
            steps {
                script {
                    def buildArgs = "-f Dockerfile.migrate . --no-cache"
                    docker.build("${IMAGE_NAME}:${TAG}", buildArgs)
                }
            }
        }
        stage('Update Database') {
            steps {
                withAWS(role: SETTINGS.ROLE_NAME, roleAccount:SETTINGS.ACCOUNT_ID, region: 'eu-west-1'){
                    script {
                        def dbEnv = utils.loadDatabaseEnv(SETTINGS, AWS_REGION)

                        utils.runLiquibaseAction("update-and-tag", dbEnv)
                    }
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
