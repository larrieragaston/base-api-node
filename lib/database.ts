import { Mongoose } from 'mongoose'
import type { Mongoose as MongooseType } from 'mongoose'
import UserSchema from '../components/user/schema'
import RoleSchema from '../components/user/schema'
import { CustomDatabase } from '../types/customDatabase.types';
import { Winston } from 'winston';
import { CustomConfig } from '../types/customConfig.types';

interface DatabaseType  {
  config: CustomConfig;
  logger: Winston;
  mongoose : MongooseType;
}

class Database implements DatabaseType{
  // config: CustomConfig;
  // logger: Winston;
  // mongoose : MongooseType;
  
  constructor(config: CustomConfig, logger: Winston) {
    this.config = config
    this.logger = logger.child({ context: 'Database' })
    this.logger.verbose('Creating mongoose instance')
    this.mongoose = new Mongoose()
    this.logger.verbose('Mongoose instance created')

    this._setupMongooseModels()
  }

  async connect() {
    this.logger.verbose('Connecting to database')

    const options = {
      maxPoolSize: 25,
    }

    await this.mongoose.connect(this.config.mongo.url, options)

    this.logger.verbose('Connected to database')
  }

  async disconnect() {
    this.logger.verbose('Disconnecting from database')
    await this.mongoose.disconnect()
    this.logger.verbose('Disconnected from database')
  }

  model(...args) {
    return this.mongoose.model(...args)
  }

  async ping() {
    if (!this.mongoose.connection.db) {
      return Promise.reject(new Error('Not connected to database'))
    }
    return this.mongoose.connection.db.admin().ping()
  }

  _setupMongooseModels() {
    this.logger.verbose('Registering models')

    this.mongoose.model('Role', RoleSchema)
    this.mongoose.model('User', UserSchema)

    this.logger.verbose('Models registered')
  }
}

export default Database
