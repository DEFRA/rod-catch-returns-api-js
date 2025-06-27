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
                    def buildArgs = "--no-cache"
                    docker.build("${IMAGE_NAME}:${TAG}", buildArgs)
                   
                }
            }
        }
        stage('Run Liquibase Migration') {
            steps {
                script {
                    def envString = env.getEnvironment().collect { k, v -> "-e ${k}=\"${v}\"" }.join(' ')                    
                    docker.image("${IMAGE_NAME}:${TAG}").inside(envString)
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
