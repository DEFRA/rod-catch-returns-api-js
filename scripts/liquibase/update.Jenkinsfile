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
                        def settings = utils.loadAWSSettings(env)
                        echo "Running with settings: ${settings}"

                        withAWS(role: settings.ROLE_NAME, roleAccount: settings.ACCOUNT_ID, region: AWS_REGION) {
                            DB_ENV = utils.loadDatabaseEnv(settings, AWS_REGION)
                        }
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
                script {
                   utils.runLiquibaseAction("update-and-tag", DB_ENV)
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
