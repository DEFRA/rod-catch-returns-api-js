import debug from 'debug'

const info = debug('rcr-api:info')
info.color = 2 // green

const error = debug('rcr-api:error')
error.color = 1 // red

export default {
  info,
  error
}
