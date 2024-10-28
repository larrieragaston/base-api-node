import http from 'http'
import express from 'express'
import expressBodyParser from 'body-parser'
import onFinished from 'on-finished'
import cors from 'cors'
import Mongoose from 'mongoose'

import { authentication, authorization } from '../components/authentication/middleware'
import UserRouter from '../components/user/route'
import StatusRouter from '../components/status/route'
import AuthenticationRouter from '../components/authentication/route'
import { CustomConfig } from '../types/customConfig.types'
import { Winston } from 'winston'

class Server {
  constructor(config: CustomConfig, logger: Winston, database) {
    this.config = config
    this.logger = logger.child({ context: 'Server' })
    this.database = database

    this.logger.verbose('Creating express app and HTTP server instance')
    this.app = express()
    this._httpServer = http.createServer(this.app)
    this.logger.verbose('Express app and HTTP server instance created')

    // Enable if we're behind a reverse proxy (Heroku, Bluemix, AWS ELB, Nginx,
    // etc) see https://expressjs.com/en/guide/behind-proxies.html
    this.app.set('trust proxy', 1)

    this._setupExpressMiddleware()
    this._setupExpressRoutes()
    this._setupErrorHandler()
  }

  async listen() {
    this.logger.verbose('Attempting to bind HTTP server to %s', this.config.server.url)
    this._httpServer.listen(this.config.server.port || 3000, (err) => {
      if (err) {
        return Promise.reject(err)
      }

      this.logger.verbose('HTTP server bound')
      return Promise.resolve()
    })
  }

  async close() {
    this._httpServer.close((err) => {
      if (err) {
        return Promise.reject(err)
      }
      return Promise.resolve()
    })
  }

  _setupExpressMiddleware() {
    this.app.request.config = this.config
    this.app.request.model = (...args) => this.database.model(...args)
    this.app.request.pingDatabase = (...args) => this.database.ping(...args)

    const requestLogger = () => (req, res, next) => {
      req._startTime = Date.now()
      req.logger = this.logger.child({})

      const headers = { ...req.headers }
      // delete headers.authorization;

      req.logger.info('Incoming request', {
        httpVersion: req.httpVersion,
        method: req.method,
        url: req.url,
        trailers: req.trailers,
        requestId: req.id,
        headers,
      })

      onFinished(res, () => {
        req.logger.info('Outgoing response', {
          user: req.user ? req.user._id : 'unauthenticated',
          httpVersion: req.httpVersion,
          method: req.method,
          url: req.url,
          statusCode: res.statusCode,
          ip: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
          requestId: req.id,
          duration: Date.now() - req._startTime,
        })
      })

      next(null)
    }

    const requestQuery = () => (req, res, next) => {
      req.select = req.query.select
      req.sort = req.query.sort
      req.populate = req.query.populate
      req.offset = req.query.offset ? parseInt(req.query.offset, 10) : 0
      req.limit = this.config.server.maxResultsLimit

      delete req.query.sort
      delete req.query.offset
      delete req.query.limit
      delete req.query.select
      delete req.query.populate

      next(null)
    }

    this.logger.verbose('Attaching middleware to express app')
    this.app.use(authorization)
    this.app.use(cors())
    this.app.use(expressBodyParser.raw())
    this.app.use(expressBodyParser.json({ limit: '50mb' }))
    this.app.use(expressBodyParser.urlencoded({ extended: true }))
    this.app.use(requestQuery())
    this.app.use(requestLogger())
    this.logger.verbose('Middleware attached')
  }

  _setupExpressRoutes() {
    this.logger.verbose('Attaching resource routers to express app')
    this.app.get('/favicon.ico', (req, res) => res.status(204))

    this.app.use('/', StatusRouter)
    this.app.use('/auth', AuthenticationRouter)
    this.app.use('/users', authentication, UserRouter)

    this.logger.verbose('Resource routers attached')
  }

  _setupErrorHandler() {
    this.logger.verbose('Attaching error handler')
    // eslint-disable-next-line no-unused-vars
    this.app.use((err, req, res, next) => {
      if (!err.statusCode) {
        err.statusCode = Server.statusCodeByErrorName[err.name] || 500
      }
      const isMongooseValidationError = err instanceof Mongoose.Error.ValidationError
      if (isMongooseValidationError) {
        req.logger.debug('Mongoose validation error', JSON.stringify(err))
        res.status(err.statusCode).json({
          errors: Object.keys(err.errors).map((field) => ({
            field,
            message: err.errors[field].message,
            kind: err.errors[field].kind,
          })),
        })
      } else {
        req.logger.error(err.toString(), err)
        req.logger.verbose('Responding to client', err.toString())
        res.status(err.statusCode).send(err.toString())
      }
    })
    this.logger.verbose('Error handler attached')
  }
}

Server.statusCodeByErrorName = {
  ValidationError: 400,
  CastError: 400,
  UnauthorizedError: 401,
}

export default Server
