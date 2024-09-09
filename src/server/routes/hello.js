export default [
  {
    method: 'GET',
    path: '/hello',
    /**
     * Handler that return hello.
     *
     * @param {import('@hapi/hapi').Request request - The Hapi request object
     * @param {import('@hapi/hapi').ResponseToolkit} h - The Hapi response toolkit
     * @returns {import('@hapi/hapi').ResponseObject} - A response containing hello
     */

    options: {
      handler: async (request, h) => {
        return h.response('Hi').code(200)
      },
      description: 'Say Hello',
      notes: 'Says Hi',
      tags: ['api']
    }
  }
]
