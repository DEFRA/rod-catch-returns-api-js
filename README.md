# Rod Catch Returns API JS

The JavaScript version of the Rod Catch Returns API.
todo add env vars

## Prerequisites

- Node v20.x (to execute npm helper scripts only, see .nvmrc for latest version)
- Docker v18.06.0+ (to run the docker services)

It is recommended to use [NVM](https://github.com/nvm-sh/nvm) to manage the node versions.

# Environment variables

| name                     | description                                                             | required | default | valid                                       | notes                                                                                                         |
| ------------------------ | ----------------------------------------------------------------------- | -------- | ------- | ------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| NODE_ENV                 | Node environment                                                        | no       |         | development, test, production               |
| PORT                     | Port number                                                             | no       | 5000    |                                             |                                                                                                               |
| DATABASE_HOST            | The host name of the PostgreSQL database                                | yes      |         |                                             |                                                                                                               |
| DATABASE_NAME            | The name of the database to connect to                                  | yes      |         |                                             |                                                                                                               |
| DATABASE_USERNAME        | The username which is used to authenticate against the database         | yes      |         |                                             |                                                                                                               |
| DATABASE_PASSWORD        | The password which is used to authenticate against the database         | yes      |         |                                             |                                                                                                               |
| DATABASE_PORT            | The port of the database                                                | no       | 5432    |                                             |                                                                                                               |
| REDIS_HOST               | Hostname of the redis instance used to cache reference data from crm    | no       |         |                                             | If undefined, local memory will be used for caching                                                           |
| REDIS_PORT               | Port number of the redis instance used to cache reference data from crm | no       | 6379    |                                             |                                                                                                               |
| REDIS_PASSWORD           | Password used to authenticate with the configured redis instance        | no       |         |                                             | If undefined, authentication will not be attempted                                                            |
| OAUTH_CLIENT_ID          | OAuth 2.0 client ID for client credentials flow                         | yes      |         |                                             |                                                                                                               |
| OAUTH_CLIENT_SECRET      | OAuth 2.0 client secret for client credentials flow                     | yes      |         |                                             |                                                                                                               |
| OAUTH_AUTHORITY_HOST_URL | OAuth 2.0 authority host                                                | yes      |         |                                             |                                                                                                               |
| OAUTH_TENANT             | OAuth 2.0 tenant                                                        | yes      |         |                                             |                                                                                                               |
| OAUTH_SCOPE              | OAuth 2.0 scope to request (client credentials resource)                | yes      |         |                                             |                                                                                                               |
| DYNAMICS_API_PATH        | Full URL to the dynamics API                                            | yes      |         |                                             | The full URL to the dynamics web api. e.g. https://dynamics-server/api/data/v9.1/                             |
| DYNAMICS_API_VERSION     | The version of the Dynamics API                                         | yes      |         |                                             | The version of the dynamics web api. e.g. 9.1                                                                 |
| DYNAMICS_API_TIMEOUT     | The Dynamics API request timeout                                        | no       | 90000   |                                             | The time in milliseconds after which requests will timeout if Dynamics does not return a response, e.g. 90000 |
| DYNAMICS_CACHE_TTL       | Default TTL for cached operations                                       | no       | 12 hrs  |                                             | The default TTL for cached operations. Specified in seconds.                                                  |
| DEBUG                    | Use to enable output of debug information to the console                | yes      |         | \*, rcr-api:\*, rcr-api:info, rcr-api:error |
| AIRBRAKE_HOST            | URL of airbrake host                                                    | no       |         |                                             |                                                                                                               |
| AIRBRAKE_PROJECT_KEY     | Project key for airbrake logging                                        | no       |         |                                             |                                                                                                               |

## Installation

Copy the example environment file and replace the relevant variables.

```shell script
cp .env.example .env
```

You'll also need to initialise a local docker swarm before you can run the infrastructure or services locally. To do so, run the following
command (you'll only need to do this once):

```shell script
docker swarm init
```

Install the project.

```shell script
npm i
```

## Running

The project uses Docker for running the project.

### Infrastructure

The [infrastructure.yml](docker/infrastructure.yml) docker-compose file contains everything that the service depends on to run.

To start the infrastructure, run the following:

```shell script
npm run docker:infrastructure
```

This will start a docker stack named `rcri` you should be able to see this listed by typing `docker stack ls`
Should you need to, this stack can be terminated by running `docker stack rm rcri`

### Migrations

There are Liquibase database migrations which need to be run. First run the following to build the Docker image:

```shell script
npm run migrate:build
```

Then run the following to bring the database up to the latest version:

```shell script
npm run migrate:up
```

N.B. if this fails to run with an error saying that that the liquibase-migrations container can't be found, try
setting the DOCKER_BUILDKIT env var to 1 (even if you're on a version of Docker Desktop that says it shouldn't
need this) and running it again.

If you would like to go back to a previous version of the database, run the following command:

```shell script
npm run migrate:down
```

### Services

#### Local

To build the image for local development (pm2-dev restarts the app when JS files are changed):

```shell script
npm run docker:build-dev
```

To run the service:

```shell script
npm run docker:service-dev
```

To stop the running ther service

```shell script
npm run docker:stop-dev
```

#### Production

To build the image for production:

```shell script
npm run docker:build
```

To run the service:

```shell script
npm run docker:service
```

To stop the running ther service

```shell script
npm run docker:stop
```

## Testing

The unit test files end in unit.spec.js whereas the intergation tests end in integration.spec.js. As the integration tests modify the database, the `DATABASE_HOST` environment variable is hardcoded to localhost in [global-setup.js](src/test-utils/global-setup.js). This ensures that they are only run against a local instance of PostgreSQL, either on a user's machine or in a CI environment.

```shell script
npm run test
```

## Contributing to this project

Please read our [contribution guidelines](CONTRIBUTING.md).

## License

THIS INFORMATION IS LICENSED UNDER THE CONDITIONS OF THE OPEN GOVERNMENT LICENCE found at:

http://www.nationalarchives.gov.uk/doc/open-government-licence/version/3

The following attribution statement MUST be cited in your products and applications when using this information.

> Contains public sector information licensed under the Open Government license v3

### About the license

The Open Government Licence (OGL) was developed by the Controller of Her Majesty's Stationery Office (HMSO) to enable information providers in the public sector to license the use and re-use of their information under a common open licence.

It is designed to encourage use and re-use of information freely and flexibly, with only a few conditions.
