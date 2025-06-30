#!/usr/bin/env groovy
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
                    def buildArgs = "-f Dockerfile.migrate . --no-cache"
                    docker.build("${IMAGE_NAME}:${TAG}", buildArgs)
                   
                }
            }
        }

        stage('Drop Database') {
            steps {
                script {
                    def envVars = [
                        "DATABASE_HOST=${env.DATABASE_HOST}",
                        "DATABASE_PORT=${env.DATABASE_PORT}",
                        "DATABASE_NAME=${env.DATABASE_NAME}",
                        "DATABASE_USERNAME=${env.DATABASE_USERNAME}",
                        "DATABASE_PASSWORD=${env.DATABASE_PASSWORD}",
                        "ACTION=\"dropAll --requireForce=true --force=true\""
                    ]
                    def envString = envVars.collect { "-e ${it}" }.join(' ')                 

                    sh """
                        docker run ${envString} ${IMAGE_NAME}:${TAG}
                    """
                }
            }
        }

        stage('Initialise Empty Tag') {
            steps {
                script {
                    def envVars = [
                        "DATABASE_HOST=${env.DATABASE_HOST}",
                        "DATABASE_PORT=${env.DATABASE_PORT}",
                        "DATABASE_NAME=${env.DATABASE_NAME}",
                        "DATABASE_USERNAME=${env.DATABASE_USERNAME}",
                        "DATABASE_PASSWORD=${env.DATABASE_PASSWORD}",
                        "ACTION='tag --tag=empty'"
                    ]
                    def envString = envVars.collect { "-e ${it}" }.join(' ')                 

                    sh """
                        docker run ${envString} ${IMAGE_NAME}:${TAG}
                    """
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
