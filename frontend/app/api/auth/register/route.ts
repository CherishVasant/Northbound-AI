import { NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/db'
import { UserData } from '@/lib/models/UserData'
import { createPasswordRecord } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const { username, email, password } = await request.json()

    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password are required.' }, { status: 400 })
    }

    if (String(password).length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long.' },
        { status: 400 },
      )
    }

    try {
      await connectToDatabase()
    } catch (err) {
      // The legacy backend "registered" users without persisting them when the
      // database was down, handing out an account that vanished. Fail closed.
      console.error('[auth/register] database unavailable:', err)
      return NextResponse.json(
        { error: 'Cannot reach the database right now. Please try again shortly.' },
        { status: 503 },
      )
    }

    const formattedUsername = String(username).trim().toLowerCase()
    const formattedEmail = email ? String(email).trim().toLowerCase() : ''

    const existingUser = await UserData.findOne({ username: formattedUsername })
    if (existingUser) {
      return NextResponse.json({ error: 'Username is already taken.' }, { status: 400 })
    }

    if (formattedEmail) {
      const existingEmail = await UserData.findOne({ email: formattedEmail })
      if (existingEmail) {
        return NextResponse.json({ error: 'Email is already registered.' }, { status: 400 })
      }
    }

    const { salt, hash, iterations } = await createPasswordRecord(password)

    try {
      const newUser = new UserData({
        username: formattedUsername,
        email: formattedEmail,
        password: hash,
        salt,
        iterations,
      })
      await newUser.save()
    } catch (err: any) {
      // Two simultaneous signups can both pass the findOne check; the unique
      // index is the real guard.
      if (err?.code === 11000) {
        return NextResponse.json(
          { error: 'Username or email is already registered.' },
          { status: 400 },
        )
      }
      throw err
    }

    return NextResponse.json(
      { success: true, message: 'User registered successfully.', username: formattedUsername },
      { status: 201 },
    )
  } catch (error) {
    console.error('[auth/register] error:', error)
    return NextResponse.json({ error: 'Server error during registration.' }, { status: 500 })
  }
}
