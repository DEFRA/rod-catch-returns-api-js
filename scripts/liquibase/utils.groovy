def runLiquibaseAction(action) {
    def envVars = [
        "DATABASE_HOST=${DATABASE_HOST}",
        "DATABASE_PORT=5432",
        "DATABASE_NAME=${DATABASE_NAME}",
        "DATABASE_USERNAME=${DATABASE_USERNAME}",
        "ACTION='${action}'",
        "DATABASE_PASSWORD=${DATABASE_PASSWORD}"
    ]
    def envString = envVars.collect { "-e ${it}" }.join(' ')

    echo "${envString} ${env.IMAGE_NAME}:${env.TAG}"

    return sh(
        script: "docker run ${envString} ${env.IMAGE_NAME}:${env.TAG}",
        returnStdout: true
    ).trim()
}

return this
