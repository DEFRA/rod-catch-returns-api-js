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
                    def buildArgs = ". --no-cache"
                    docker.build("${IMAGE_NAME}:${TAG}", buildArgs)
                   
                }
            }
        }
        stage('Run Liquibase Migration') {
            steps {
                script {
                    def envVars = [
                        "DATABASE_HOST=${env.DATABASE_HOST}",
                        "DATABASE_PORT=${env.DATABASE_PORT}",
                        "DATABASE_USERNAME=${env.DATABASE_USERNAME}",
                        "DATABASE_PASSWORD=${env.DATABASE_PASSWORD}",
                    //    "ACTION=${env.ACTION}"
                    ]
                    def envString = envVars.collect { "-e ${it}" }.join(' ')                 
                    //docker.image("${IMAGE_NAME}:${TAG}").inside(envString)
                    sh """
                        docker run ${envString}" "${IMAGE_NAME}:${TAG}"
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
