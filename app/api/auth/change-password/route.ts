import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { query } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { NextRequest, NextResponse } from 'next/server'

interface UserRow {
  id: number
  password_hash: string
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { currentPassword, newPassword } = body

    if (!newPassword || newPassword.length < 8) {
      return NextResponse.json({ error: 'New password must be at least 8 characters' }, { status: 400 })
    }

    // Get current hash
    const result = await query<UserRow>(
      'SELECT id, password_hash FROM users WHERE email = $1',
      [session.user.email]
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const user = result.rows[0]

    // If not a forced change, verify current password
    if (currentPassword) {
      const isValid = await bcrypt.compare(currentPassword, user.password_hash)
      if (!isValid) {
        return NextResponse.json({ error: 'Current password is incorrect' }, { status: 403 })
      }
    }

    // Hash and save new password
    const newHash = await bcrypt.hash(newPassword, 10)
    await query(
      'UPDATE users SET password_hash = $1, must_change_password = false WHERE id = $2',
      [newHash, user.id]
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('POST /api/auth/change-password error:', error)
    return NextResponse.json({ error: 'Failed to change password' }, { status: 500 })
  }
}
