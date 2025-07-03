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
                        message: 'Are you sure you want to proceed? This will rollback to a specified tag in the database!'
                    )
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

        stage('Choose target tag') {
            steps {
                script {
                    def rawTags = utils.runLiquibaseAction("execute-sql --sql=\"SELECT DISTINCT tag FROM databasechangelog WHERE tag IS NOT NULL;\"")

                    echo "Raw tags: ${rawTags}"

                    if (!rawTags || !rawTags.contains('Output of SELECT')) {
                        error "No tags found or unexpected format in Liquibase output."
                    }

                    def lines = rawTags.readLines()

                    def outputStartIndex = lines.findIndexOf { it.contains('Output of SELECT') }
                    def tagLines = lines.drop(outputStartIndex + 2) // skip "TAG |" header line as well

                    def tags = tagLines
                        .findAll { it?.trim() && it.contains('|') }
                        .collect { it.split('\\|')[0].trim() }

                    echo "Available tags: ${tags}"

                    if (rawTags.isEmpty()) {
                        error "No tags found in databasechangelog."
                    }

                    def selectedTag = input message: 'Choose a database tag to apply', parameters: [
                        choice(name: 'TAG', choices: tags.join('\n'), description: 'Select a tag from the list')
                    ]
            
                    CHOSEN_TAG = selectedTag
                    echo "Selected tag: ${CHOSEN_TAG}"
                }
            }
        }

        stage('Rolling back database schema') {
            steps {
                script {
                    utils.runLiquibaseAction("rollback --tag=${CHOSEN_TAG}")
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
