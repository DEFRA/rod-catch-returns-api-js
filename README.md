# Rod Catch Returns API JS

The JavaScript version of the Rod Catch Returns API.

## Prerequisites

- Node v18.x (see .nvmrc)
- PostgreSQL

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

Install the project.

```shell script
npm i
```

## Running

```shell script
npm start
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
