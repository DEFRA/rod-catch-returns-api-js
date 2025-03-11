import debug from 'debug'
import { nativeConsoleMethods } from './native-console.js'

const info = debug('rcr-api:info')
info.color = 2 // green
info.log = nativeConsoleMethods.info

const error = debug('rcr-api:error')
error.color = 1 // red
error.log = nativeConsoleMethods.error

export default {
  info,
  error
}
