import crypto from 'crypto'

/**
 * PBKDF2-HMAC-SHA512 password hashing.
 *
 * The original Express backend used 1000 iterations, far below the OWASP
 * guidance of 210,000 for SHA512. Accounts created then have no `iterations`
 * field, so they are verified at LEGACY_ITERATIONS and transparently re-hashed
 * at the current cost on their next successful login.
 */

export const CURRENT_ITERATIONS = 210_000
export const LEGACY_ITERATIONS = 1000

const KEY_LENGTH = 64
const DIGEST = 'sha512'

export function generateSalt() {
  return crypto.randomBytes(16).toString('hex')
}

export function hashPassword(password: string, salt: string, iterations: number): Promise<string> {
  return new Promise((resolve, reject) => {
    // Async so a 210k-iteration hash doesn't block the event loop.
    crypto.pbkdf2(password, salt, iterations, KEY_LENGTH, DIGEST, (err, derived) => {
      if (err) reject(err)
      else resolve(derived.toString('hex'))
    })
  })
}

/** Constant-time compare; never short-circuits on the first differing byte. */
export function safeEqual(a: string, b: string) {
  const bufA = Buffer.from(a, 'utf8')
  const bufB = Buffer.from(b, 'utf8')
  if (bufA.length !== bufB.length) return false
  return crypto.timingSafeEqual(bufA, bufB)
}

export async function verifyPassword(
  password: string,
  storedHash: string,
  salt: string,
  iterations?: number | null,
) {
  const usedIterations = iterations ?? LEGACY_ITERATIONS
  const computed = await hashPassword(password, salt, usedIterations)
  const valid = safeEqual(computed, storedHash)
  return { valid, needsRehash: valid && usedIterations < CURRENT_ITERATIONS }
}

export async function createPasswordRecord(password: string) {
  const salt = generateSalt()
  const hash = await hashPassword(password, salt, CURRENT_ITERATIONS)
  return { salt, hash, iterations: CURRENT_ITERATIONS }
}
