export const sessionMiddleware = async (request, h) => {
  const sessionId = request.headers.sessionid

  if (!sessionId) {
    return h.continue // Proceed if no sessionId is provided
  }
  console.log(sessionId)
  try {
    const cachedSession = await request.server.app.cache.get(sessionId)

    if (cachedSession) {
      request.app.session = cachedSession // Attach to request
    }
  } catch (error) {
    request.server.logger.error(`Error retrieving session from cache: ${error}`)
  }

  return h.continue
}
