import { NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/db'
import { UserData } from '@/lib/models/UserData'
import { verifyPassword, createPasswordRecord } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const { usernameOrEmail, password } = await request.json()

    if (!usernameOrEmail || !password) {
      return NextResponse.json(
        { error: 'Username/Email and password are required.' },
        { status: 400 },
      )
    }

    try {
      await connectToDatabase()
    } catch (err) {
      // The legacy Express backend logged the user in when the database was
      // unreachable, which accepted ANY password. Never do that: fail closed.
      console.error('[auth/login] database unavailable:', err)
      return NextResponse.json(
        { error: 'Cannot reach the database right now. Please try again shortly.' },
        { status: 503 },
      )
    }

    const searchKey = String(usernameOrEmail).trim().toLowerCase()

    const user = await UserData.findOne({
      $or: [{ username: searchKey }, { email: searchKey }],
    })

    // Same message and shape whether the account is missing or the password is
    // wrong, so this can't be used to enumerate registered usernames.
    if (!user || !user.password || !user.salt) {
      return NextResponse.json({ error: 'Invalid username/email or password.' }, { status: 401 })
    }

    const { valid, needsRehash } = await verifyPassword(
      password,
      user.password,
      user.salt,
      user.iterations,
    )

    if (!valid) {
      return NextResponse.json({ error: 'Invalid username/email or password.' }, { status: 401 })
    }

    // Upgrade legacy 1000-iteration hashes now that we have the plaintext.
    if (needsRehash) {
      try {
        const record = await createPasswordRecord(password)
        user.password = record.hash
        user.salt = record.salt
        user.iterations = record.iterations
        await user.save({ validateBeforeSave: false })
      } catch (err) {
        // A failed upgrade must not fail an otherwise valid login.
        console.error('[auth/login] password rehash failed:', err)
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Authentication successful.',
      username: user.username,
      email: user.email,
    })
  } catch (error) {
    console.error('[auth/login] error:', error)
    return NextResponse.json({ error: 'Server error during login.' }, { status: 500 })
  }
}
