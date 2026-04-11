import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { query } from './db'

interface UserRow {
  id: number
  name: string
  email: string
  password_hash: string
  boat_id: number | null
  must_change_password: boolean
}

interface BoatRow {
  id: number
  name: string
  slug: string
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password required')
        }

        const result = await query<UserRow>(
          'SELECT id, name, email, password_hash, boat_id, must_change_password FROM users WHERE email = $1',
          [credentials.email]
        )

        if (result.rows.length === 0) {
          throw new Error('No user found with that email')
        }

        const user = result.rows[0]
        const isPasswordValid = await bcrypt.compare(credentials.password, user.password_hash)

        if (!isPasswordValid) {
          throw new Error('Invalid password')
        }

        // Get boat slug
        let boatSlug = ''
        if (user.boat_id) {
          const boatResult = await query<BoatRow>(
            'SELECT id, slug FROM boats WHERE id = $1',
            [user.boat_id]
          )
          if (boatResult.rows.length > 0) {
            boatSlug = boatResult.rows[0].slug
          }
        }

        return {
          id: user.id.toString(),
          name: user.name,
          email: user.email,
          boatId: user.boat_id?.toString() || '',
          boatSlug,
          mustChangePassword: user.must_change_password,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.boatId = user.boatId
        token.boatSlug = user.boatSlug
        token.mustChangePassword = user.mustChangePassword
      }
      // Allow session update to clear the flag after password change
      if (trigger === 'update') {
        token.mustChangePassword = false
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.boatId = token.boatId as string
        session.user.boatSlug = token.boatSlug as string
        session.user.mustChangePassword = token.mustChangePassword as boolean
      }
      return session
    },
  },
  pages: {
    signIn: '/admin/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
}
