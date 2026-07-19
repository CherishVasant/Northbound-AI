import mongoose from 'mongoose'

/**
 * Serverless-safe MongoDB connection.
 *
 * On Vercel each function invocation may reuse a warm container, and a naive
 * `mongoose.connect()` per request would open a new pool every time and quickly
 * exhaust Atlas's connection limit. We cache the connection promise on the
 * global object so that concurrent cold-start requests share a single connect()
 * rather than racing.
 */

const MONGODB_URI = process.env.MONGODB_URI

interface MongooseCache {
  conn: typeof mongoose | null
  promise: Promise<typeof mongoose> | null
}

declare global {
  // eslint-disable-next-line no-var
  var _mongooseCache: MongooseCache | undefined
}

const cached: MongooseCache = global._mongooseCache ?? { conn: null, promise: null }
global._mongooseCache = cached

export async function connectToDatabase() {
  if (!MONGODB_URI) {
    throw new Error(
      'MONGODB_URI is not set. Add it to your environment (locally in frontend/.env, ' +
        'and in your hosting provider\'s environment variables for deployments).',
    )
  }

  if (cached.conn) return cached.conn

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
      // Fail fast instead of hanging the serverless function for 30s.
      serverSelectionTimeoutMS: 10000,
    })
  }

  try {
    cached.conn = await cached.promise
  } catch (err) {
    // Clear the rejected promise so the next request retries instead of
    // replaying the same failure forever.
    cached.promise = null
    throw err
  }

  return cached.conn
}
