import { Router } from 'express'
// import pkg from '../../package.json'

const router = new Router()

router.get('/', getRoot)
router.get('/status', getStatus)

function getRoot(req, res) {
  req.logger.verbose('Responding to root request')
  req.logger.verbose('Sending response to client')

  /* eslint-disable no-undef */
  res.send({
    name: 'pkg.name',
    // name: pkg.name,
    version: 'pkg.version',
    // version: pkg.version,
    enviroment: process.env.ENV,
  })
}

async function getStatus(req, res, next) {
  req.logger.verbose('Responding to status request')

  try {
    const result = await req.pingDatabase()

    if (!result || !result.ok) {
      return res.sendStatus(503)
    }

    res.status(200).send('The API is up and running')
  } catch (err) {
    next(err)
  }
}

export default router
