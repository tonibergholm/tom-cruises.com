import NextAuth from 'next-auth'

declare module 'next-auth' {
  interface User {
    boatId?: string
    boatSlug?: string
    mustChangePassword?: boolean
  }

  interface Session {
    user: {
      id?: string
      name?: string | null
      email?: string | null
      image?: string | null
      boatId?: string
      boatSlug?: string
      mustChangePassword?: boolean
    }
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    boatId?: string
    boatSlug?: string
    mustChangePassword?: boolean
  }
}
