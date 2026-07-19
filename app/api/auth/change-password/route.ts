import { NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/db'
import { UserData } from '@/lib/models/UserData'
import { verifyPassword, createPasswordRecord } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const { username, currentPassword, newPassword } = await request.json()

    if (!username || !currentPassword || !newPassword) {
      return NextResponse.json(
        { error: 'Username, current password and new password are all required.' },
        { status: 400 },
      )
    }

    if (String(newPassword).length < 8) {
      return NextResponse.json(
        { error: 'New password must be at least 8 characters long.' },
        { status: 400 },
      )
    }

    if (String(newPassword) === String(currentPassword)) {
      return NextResponse.json(
        { error: 'The new password must be different from the current one.' },
        { status: 400 },
      )
    }

    try {
      await connectToDatabase()
    } catch (err) {
      // Never fall through to "changed" when the database is unreachable — the
      // user would believe their password had changed when it had not.
      console.error('[auth/change-password] database unavailable:', err)
      return NextResponse.json(
        { error: 'Cannot reach the database right now. Please try again shortly.' },
        { status: 503 },
      )
    }

    const user = await UserData.findOne({ username: String(username).trim().toLowerCase() })
    if (!user || !user.password || !user.salt) {
      return NextResponse.json({ error: 'Current password is incorrect.' }, { status: 401 })
    }

    // Same verification path as login, so accounts still on the legacy
    // 1000-iteration hash can change their password too.
    const { valid } = await verifyPassword(
      currentPassword,
      user.password,
      user.salt,
      user.iterations,
    )
    if (!valid) {
      return NextResponse.json({ error: 'Current password is incorrect.' }, { status: 401 })
    }

    const record = await createPasswordRecord(newPassword)
    user.password = record.hash
    user.salt = record.salt
    user.iterations = record.iterations
    await user.save({ validateBeforeSave: false })

    return NextResponse.json({ success: true, message: 'Password updated.' })
  } catch (error) {
    console.error('[auth/change-password] error:', error)
    return NextResponse.json({ error: 'Server error while changing password.' }, { status: 500 })
  }
}
