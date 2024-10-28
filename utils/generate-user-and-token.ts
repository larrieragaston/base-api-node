import jwt from 'jsonwebtoken'
import fs from 'fs'
import path from 'path'

import { fileURLToPath } from 'url'
const __filename = fileURLToPath(import.meta.url) // get the resolved path to the file
const __dirname = path.dirname(__filename) // get the name of the directory

async function generateUserAndToken(req, user) {
  const role = await req.model('Role').findById(user.role).exec()

  const payload = {
    _id: user._id,
    role: role.name,
  }

  const userResponse = {
    _id: user._id,
    role: role.name,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
  }

  // The next line is only when the app is deployed
  // const privateKey = await req.secrets.get(req.config.auth.key)
  const privateKey = fs.readFileSync(path.join(__dirname, `../keys/${req.config.auth.key}.pem`))

  const token = jwt.sign(payload, privateKey, {
    subject: user._id.toString(),
    issuer: req.config.auth.token.issuer,
    algorithm: req.config.auth.token.algorithm,
    expiresIn: req.config.auth.passwordTtl,
  })

  return { token, user: userResponse }
}

export default generateUserAndToken
