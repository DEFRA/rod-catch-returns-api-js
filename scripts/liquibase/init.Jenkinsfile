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
                        id: 'userConfirmation', message: 'Are you sure you want to proceed?',
                        parameters: [
                            choice(
                                choices: ['No', 'Yes'],
                                description: 'This will DROP ALL TABLES and initialise empty tables!',
                                name: 'Confirm'
                            )
                        ]
                    )

                    if (userInput != 'Yes') {
                        error("Aborting pipeline as per user input.")
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

        stage('Drop Database') {
            steps {
                script {
                    utils.runLiquibaseAction("dropAll --requireForce=true --force=true")
                }
            }
        }

        stage('Initialise Empty Tag') {
            steps {
                script {
                    utils.runLiquibaseAction("tag --tag=empty")
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
