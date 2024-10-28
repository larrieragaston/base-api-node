import winston from 'winston'
import winstonChildLogger from 'winston-child-logger'
import config from 'config'

const logger = winstonChildLogger(new winston.Logger())

logger.levelLength = 7
logger.padLevels = true

logger.filters.push((_, message, meta) => {
  if (!message && meta instanceof Error) {
    return meta.stack || meta.message
  }
  return message
})

if (config.logger.console) {
  logger.add(winston.transports.Console, config.logger.console)
}

export default logger
