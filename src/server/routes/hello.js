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
    handler: async (request, h) => {
      return h.response('Hello mate').code(200)
    }
  }
]
