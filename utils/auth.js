const crypto = require('crypto')

const MAX_AGE_MS = 5 * 1000 // 5 seconds

const checkLoginSignature = (signature, timestamp) => {
  const SHARED_SECRET = process.env.JWT_SECRET // store securely

  const now = Date.now()
  const reqTime = parseInt(timestamp, 10)

  if (Math.abs(now - reqTime) > MAX_AGE_MS) {
    throw new Error('Timestamp too old or too far in the future')
  }

  const dataToSign = `${timestamp}`

  const expectedSignature = crypto
    .createHmac('sha256', SHARED_SECRET)
    .update(dataToSign)
    .digest('hex')

  return expectedSignature === signature
}

module.exports = {
  checkLoginSignature
}