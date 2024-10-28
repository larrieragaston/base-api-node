import Server from './server'
import Database from './database'
import { CustomConfig } from '../types/customConfig.types'
import { Winston } from 'winston';
import { CustomDatabase } from '../types/customDatabase.types';

class BaseApi {
  config: CustomConfig;
  logger: Winston;
  isRunning: boolean
  database : CustomDatabase;

  constructor(config: CustomConfig, logger:Winston) {
    this.config = config
    this.logger = logger.child({ context: 'BaseApi' })
    this.isRunning = false
    this.database = new Database(config, this.logger)
    this.server = new Server(config, this.logger, this.database)
  }

  async start() {
    if (this.isRunning) {
      throw new Error('Cannot start BaseApi because it is already running')
    }
    this.isRunning = true

    this.logger.verbose('Starting BaseApi')
    await Promise.all([this.database.connect(), this.server.listen()])
    this.logger.verbose('BaseApi ready and awaiting requests')

    return { url: this.config.server.url }
  }

  async stop() {
    if (!this.isRunning) {
      throw new Error('Cannot stop BaseApi because it is already stopped')
    }
    this.isRunning = false

    this.logger.verbose('Stopping BaseApi')
    await Promise.all([this.database.disconnect(), this.server.close()])
    this.logger.verbose('BaseApi has closed all connections and successfully halted')
  }
}

export default BaseApi
