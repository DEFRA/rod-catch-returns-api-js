import { StatusCodes } from 'http-status-codes'
import logger from './logger-utils.js'

export const handleNotFound = (loggerMessage, h) => {
  logger.error(loggerMessage)
  return h.response().code(StatusCodes.NOT_FOUND)
}

export const handleServerError = (loggerMessage, error, h) => {
  logger.error(loggerMessage, error)
  return h
    .response({ error: loggerMessage })
    .code(StatusCodes.INTERNAL_SERVER_ERROR)
}

export const logRequest = (request, h) => {
  if (request.path.includes('/service-status')) {
    return h.continue
  }

  const method = request.method.toUpperCase()

  let logLine = `${method} ${request.path}${request?.url?.search || ''}`

  if (['POST', 'PATCH', 'PUT'].includes(method) && request.payload) {
    logLine += ` | body=${JSON.stringify(request.payload)}`
  }

  logger.info(logLine)

  return h.continue
}

export const logResponse = (request, h) => {
  if (request.path.includes('/service-status')) {
    return h.continue
  }

  logger.info(
    `${request.method.toUpperCase()} ${request.path} -> ${request.response?.statusCode}`
  )
  return h.continue
}
