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
