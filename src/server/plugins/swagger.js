import HapiSwagger from 'hapi-swagger'

export default {
  plugin: HapiSwagger,
  options: {
    info: {
      title: 'Rod Catch Returns API Documentation',
      version: process.env.npm_package_version
    },
    grouping: 'tags',
    sortEndpoints: 'ordered'
  }
}
