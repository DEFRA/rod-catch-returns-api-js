def runLiquibaseAction(action, dbEnv) {
    def envVars = dbEnv + [ACTION: "'${action}'"]

    def envString = envVars.collect { k, v -> "-e ${k}=${v}" }.join(' ')

    echo "Running Liquibase Docker container IMAGE=${env.IMAGE_NAME}:${env.TAG} for ACTION=${action}"

    sh(script: """
        set +x
        docker run --rm ${envString} ${env.IMAGE_NAME}:${env.TAG}
    """, returnStdout: true).trim()
}

def fetchSecret(parameterName, region) {
    return sh(
        script: "aws ssm get-parameter --name '${parameterName}' --with-decryption --region ${region} --query Parameter.Value --output text",
        returnStdout: true
    ).trim()
}

def fetchParameter(paramName, region) {
    return sh(
        script: "aws ssm get-parameter --name '${paramName}' --with-decryption --region ${region} --query 'Parameter.Value' --output text",
        returnStdout: true
    ).trim()
}

def loadDatabaseEnv(paramSecretPrefix, region) {
    return [
        DATABASE_NAME    : fetchParameter("/${paramSecretPrefix}/ire/rcr/webops/rds/db_name", region),
        DATABASE_HOST    : fetchParameter("/${paramSecretPrefix}/ire/rcr/webops/rds/hostname", region),
        DATABASE_PASSWORD: fetchSecret("/${paramSecretPrefix}/ire/webops/rcr/rds/db_password", region),
        DATABASE_USERNAME: fetchSecret("/${paramSecretPrefix}/ire/webops/rcr/rds/db_user", region),
        DATABASE_PORT    : 5432
    ]
}

def loadAWSSettings(env) {
    def SETTINGS = [:]
    SETTINGS.ENVIRONMENT = env.ENVIRONMENT
    SETTINGS.LOCATION = env.LOCATION
    SETTINGS.SERVICE_CODE = env.SERVICE_CODE
    SETTINGS.PARAM_SECRET_PREFIX = "/${SETTINGS.ENVIRONMENT}/${SETTINGS.LOCATION}/${SETTINGS.SERVICE_CODE}/webops".toLowerCase()
    SETTINGS.ACCOUNT_ID = env.ACCOUNT_ID
    SETTINGS.ROLE_NAME = env.ROLE_NAME
    SETTINGS.REGION = env.REGION

    echo "Running with settings: ${SETTINGS}"

    return SETTINGS
}

return this
