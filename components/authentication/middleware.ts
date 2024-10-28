import jwt from 'jsonwebtoken'
import createError from 'http-errors'

import publicKey from '../../lib/public-key'

function getToken(req, next) {
  const TOKEN_REGEX = /^\s*Bearer\s+(\S+)/g
  const matches = TOKEN_REGEX.exec(req.headers.authorization)

  if (!matches) {
    return next(new createError.Unauthorized())
  }

  const [, token] = matches
  return token
}

export const authentication = (req, res, next) => {
  if (!req.headers.authorization) {
    req.logger.warn('Missing authorization header')
    return next(new createError.Unauthorized())
  }

  const token = getToken(req, next)

  try {
    req.user = jwt.verify(token, publicKey, {
      algorithms: [req.config.auth.token.algorithm],
      issuer: req.config.auth.token.issuer,
    })

    if (!req.user || !req.user._id || !req.user.role) {
      req.logger.error('Error authenticating malformed JWT')
      return next(new createError.Unauthorized())
    }

    req.logger.verbose(`User ${req.user._id} authenticated`)

    next(null)
  } catch (err) {
    if (err.message === 'invalid algorithm' || err.message === 'invalid signature') {
      const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress
      req.logger.error(`Suspicious access attempt from ip=${ip} ${token}`)
    }
    if (err.name === 'TokenExpiredError') {
      req.logger.warn('Expired token, sending 401 to client')
      return res.sendStatus(401)
    }
    return next(new createError.Unauthorized(err))
  }
}

export const authorization = (req, res, next) => {
  req.isAdmin = function isAdmin() {
    return req.user && req.user.role === 'admin'
  }

  req.isClient = function isClient() {
    return req.user && req.user.role === 'client'
  }

  return next(null)
}
