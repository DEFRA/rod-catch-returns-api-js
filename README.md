# Rod Catch Returns API JS

The JavaScript version of the Rod Catch Returns API.

## Prerequisites

- Node v18.x (to execute npm helper scripts only, see .nvmrc for latest version)
- Docker v18.06.0+ (to run the docker services)

It is recommended to use [NVM](https://github.com/nvm-sh/nvm) to manage the node versions.

# Environment variables

| name              | description                                                     | required | default | valid | notes |
| ----------------- | --------------------------------------------------------------- | -------- | ------- | ----- | ----- |
| PORT              | Port number                                                     | no       | 5000    |       |       |
| DATABASE_HOST     | The host name of the PostgreSQL database                        | yes      |         |       |       |
| DATABASE_USERNAME | The username which is used to authenticate against the database | yes      |         |       |       |
| DATABASE_PASSWORD | The password which is used to authenticate against the database | yes      |         |       |       |
| DATABASE_PORT     | The port of the database                                        | no       | 5432    |       |       |

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

### Services

To build the images:

```shell script
npm run docker:build-dev
```

To run the services:

```shell script
npm run docker:services-dev
```

To stop the running services

```shell script
docker stack rm rcrs
```

## Testing

The unit test files end in unit.spec.js whereas the intergation tests end in integration.spec.js. The integration tests need to be run in a docker container.

```shell script
npm run docker:test
```

To clean up the docker test containers run

```shell script
npm run docker:test-clear
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
