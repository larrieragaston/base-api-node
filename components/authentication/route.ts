import { Router } from 'express'

import generateUserAndToken from '../../utils/generate-user-and-token.js'

const router = new Router()

router.post('/token', createUserToken)

async function createUserToken(req, res, next) {
  req.logger.info(`Creating user token for ${req.body.email}`)

  if (!req.body.email) {
    req.logger.verbose('Missing email parameter. Sending 400 to client')
    return res.status(400).end()
  }

  if (!req.body.password) {
    req.logger.info('Missing password parameter. Sending 400 to client')
    return res.status(400).end()
  }

  try {
    const user = await req.model('User').findOne({ email: req.body.email }, '+password')

    if (!user) {
      req.logger.verbose('User not found. Sending 404 to client')
      return res.status(401).end()
    }

    req.logger.verbose('Checking user password')
    const { passwordTtl } = req.config.auth
    const result = await user.checkPassword(req.body.password, passwordTtl)

    if (result.isLocked) {
      req.logger.verbose('User is locked. Sending 400 (Locked) to client')
      return res.status(400).end()
    }

    if (!result.isOk) {
      req.logger.verbose('User password is invalid. Sending 401 to client')
      return res.status(401).end()
    }

    const response = await generateUserAndToken(req, user)

    res.status(201).json(response)
  } catch (err) {
    next(err)
  }
}

export default router
