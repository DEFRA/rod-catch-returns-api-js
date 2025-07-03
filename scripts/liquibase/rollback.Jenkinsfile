#!/usr/bin/env groovy
def utils

pipeline {
    agent any

    environment {
        IMAGE_NAME = 'defra/rod-catch-returns-liquibase-migrator'
        TAG = 'latest'
    }

    stages {
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

                    def tags = rawTags.readLines()
                        .findAll { it && !it.toLowerCase().contains('tag') } // Remove headers
                        .collect { it.trim() }

                    echo "Available tags: ${tags}"

                    if (rawTags.isEmpty()) {
                        error "No tags found in databasechangelog."
                    }

                    def selectedTag = input message: 'Choose a database tag to apply', parameters: [
                        choice(name: 'TAG', choices: tags.join('\n'), description: 'Select a tag from the list')
                    ]
            
                    env.CHOSEN_TAG = selectedTag
                    echo "Selected tag: ${env.CHOSEN_TAG}"
                }
            }
        }

        stage('Rolling back database schema') {
            steps {
                script {
                    echo 'hi'
                    //utils.runLiquibaseAction("update-and-tag")
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
