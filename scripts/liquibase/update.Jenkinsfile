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
                    withAWS(role: SETTINGS.ROLE_NAME, roleAccount:SETTINGS.ACCOUNT_ID, region:'eu-west-1'){
                        script {
                        DATABASE_USERNAME = sh(
                            script: "aws secretsmanager get-secret-value --secret-id '${SETTINGS.PARAM_SECRET_PREFIX}/rds/db_user' --region ${AWS_REGION} --query SecretString --output text",
                            returnStdout: true
                        ).trim()
                        DATABASE_PASSWORD = sh(
                            script: "aws secretsmanager get-secret-value --secret-id '${SETTINGS.PARAM_SECRET_PREFIX}/rds/db_password' --region ${AWS_REGION} --query SecretString --output text > /tmp/dbpass",
                            returnStdout: false
                        )
                        DATABASE_HOST = sh(
                            script: "aws ssm get-parameter --name '${SETTINGS.PARAM_SECRET_PREFIX}/rds/hostname' --with-decryption --region eu-west-1 --query 'Parameter.Value' --output text",
                            returnStdout: true
                        ).trim()
                        DATABASE_NAME = sh(
                            script: "aws ssm get-parameter --name '${SETTINGS.PARAM_SECRET_PREFIX}/rds/db_name' --with-decryption --region eu-west-1 --query 'Parameter.Value' --output text",
                            returnStdout: true
                        ).trim()
                            utils.runLiquibaseAction("update-and-tag")
                        }
                    }
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
