def runLiquibaseAction(action, dbEnv) {
    // Always include the action
    def envVars = dbEnv + [ACTION: action]

    // Build docker -e args
    def envString = envVars.collect { k, v -> "-e ${k}=${v}" }.join(' ')

    // Safe log (no password)
    echo "Running liquibase with IMAGE=${env.IMAGE_NAME}:${env.TAG}, HOST=${dbEnv.DATABASE_HOST}, DB=${dbEnv.DATABASE_NAME}, ACTION=${action}"

    echo "${envString} ${env.IMAGE_NAME}:${env.TAG}"

    return sh(
        script: "docker run --rm ${envString} ${env.IMAGE_NAME}:${env.TAG}",
        returnStdout: true
    ).trim()
}

def fetchSecret(secretId, region) {
    return sh(
        script: "aws secretsmanager get-secret-value --secret-id '${secretId}' --region ${region} --query SecretString --output text",
        returnStdout: true
    ).trim()
}

def fetchParameter(paramName, region) {
    return sh(
        script: "aws ssm get-parameter --name '${paramName}' --with-decryption --region ${region} --query 'Parameter.Value' --output text",
        returnStdout: true
    ).trim()
}

def loadDatabaseEnv(SETTINGS, region) {
    return [
        DATABASE_USERNAME: fetchSecret("${SETTINGS.PARAM_SECRET_PREFIX}/rds/db_user", region),
        DATABASE_PASSWORD: fetchSecret("${SETTINGS.PARAM_SECRET_PREFIX}/rds/db_password", region),
        DATABASE_HOST    : fetchParameter("${SETTINGS.PARAM_SECRET_PREFIX}/rds/hostname", region),
        DATABASE_NAME    : fetchParameter("${SETTINGS.PARAM_SECRET_PREFIX}/rds/db_name", region),
        DATABASE_PORT    : 5432
    ]
}

return this
