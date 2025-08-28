def runLiquibaseAction(action) {
    def envVars = [
        "DATABASE_HOST=${DATABASE_HOST}",
        "DATABASE_PORT=${DATABASE_PORT}",
        "DATABASE_NAME=${DATABASE_NAME}",
        "DATABASE_USERNAME=${DATABASE_USERNAME}",
        "DATABASE_PASSWORD=${DATABASE_PASSWORD}",
        "ACTION='${action}'"
    ]
    def envString = envVars.collect { "-e ${it}" }.join(' ')

    return sh(
        script: "docker run ${envString} ${env.IMAGE_NAME}:${env.TAG}",
        returnStdout: true
    ).trim()
}

return this
