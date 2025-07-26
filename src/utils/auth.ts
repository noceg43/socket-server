import crypto from 'crypto'

const MAX_AGE_MS = 5 * 1000 // 5 seconds

export const checkLoginSignature = (signature: string, timestamp: string): boolean => {
  const SHARED_SECRET = process.env.JWT_SECRET // store securely

  if (!SHARED_SECRET) {
    throw new Error('JWT_SECRET not configured')
  }

  const now = Date.now()
  const reqTime = parseInt(timestamp, 10)

  if (isNaN(reqTime)) {
    throw new Error('Invalid timestamp format')
  }

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

export default {
  checkLoginSignature
}
