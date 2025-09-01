#!/usr/bin/env groovy
def utils

pipeline {
    agent any

    environment {
        IMAGE_NAME = 'defra/rod-catch-returns-liquibase-migrator'
        TAG = 'latest'
    }

    stages {
        stage('Confirm Database Reset') {
            steps {
                script {
                    def userInput = input(
                        message: 'Are you sure you want to proceed? This will DROP ALL TABLES and initialise empty tables!'
                    )
                }
            }
        }

        stage('Preparing') {
            steps {
                withFolderProperties {
                    script {
                        utils = load "scripts/liquibase/utils.groovy"
                        def settings = utils.loadAWSSettings(env)
                        echo "Running with settings: ${settings}"

                        withAWS(role: settings.ROLE_NAME, roleAccount: settings.ACCOUNT_ID, region: SETTINGS.REGION) {
                            DB_ENV = utils.loadDatabaseEnv(SETTINGS.PARAM_SECRET_PREFIX, SETTINGS.REGION)
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

        stage('Drop Database') {
            steps {
                script {
                    utils.runLiquibaseAction("dropAll --requireForce=true --force=true", DB_ENV)
                }
            }
        }

        stage('Initialise Empty Tag') {
            steps {
                script {
                    utils.runLiquibaseAction("tag --tag=empty", DB_ENV)
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
