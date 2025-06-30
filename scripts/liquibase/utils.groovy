def runLiquibaseAction(action) {
    def envVars = [
        "DATABASE_HOST=${env.DATABASE_HOST}",
        "DATABASE_PORT=${env.DATABASE_PORT}",
        "DATABASE_NAME=${env.DATABASE_NAME}",
        "DATABASE_USERNAME=${env.DATABASE_USERNAME}",
        "DATABASE_PASSWORD=${env.DATABASE_PASSWORD}",
        "ACTION='${action}'"
    ]
    def envString = envVars.collect { "-e ${it}" }.join(' ')

    sh """
        docker run ${envString} ${env.IMAGE_NAME}:${env.TAG}
    """
}
