'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import Link from 'next/link'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const pathname = usePathname()

  // These pages render without the admin sidebar
  const isLoginPage = pathname === '/admin/login'
  const isChangePasswordPage = pathname === '/admin/change-password'
  const isFullScreenPage = isLoginPage || isChangePasswordPage

  useEffect(() => {
    if (status === 'unauthenticated' && !isLoginPage) {
      router.push('/admin/login')
    }
  }, [status, router, isLoginPage])

  // Force password change redirect
  useEffect(() => {
    if (status === 'authenticated' && session?.user?.mustChangePassword && !isChangePasswordPage) {
      router.push('/admin/change-password')
    }
  }, [status, session, router, isChangePasswordPage])

  // Login and change-password pages bypass the admin layout
  if (isFullScreenPage) {
    return <>{children}</>
  }

  if (status === 'loading') {
    return (
      <div style={{ padding: '3rem', textAlign: 'center' }}>
        <div className="spinner"></div>
        <p style={{ marginTop: '1rem', color: 'var(--color-ink-faint)', fontSize: '0.9rem' }}>Loading...</p>
      </div>
    )
  }

  if (status === 'unauthenticated') {
    return null
  }

  // Block access if password change is required
  if (session?.user?.mustChangePassword) {
    return null
  }

  const user = session?.user as any
  const isActive = (path: string) => pathname === path

  return (
    <div className="admin-container">
      <aside className="admin-sidebar">
        <h2>Admin Panel</h2>
        <div className="boat-info">
          <p>
            <strong>{user?.name}</strong>
          </p>
          <p style={{ fontSize: '0.82rem', color: 'var(--color-ink-faint)' }}>{user?.email}</p>
          <p style={{ fontSize: '0.82rem', marginTop: '0.4rem', color: 'var(--color-ink-muted)' }}>
            Boat: <strong>{user?.boatSlug}</strong>
          </p>
        </div>
        <nav>
          <Link href="/admin" className={isActive('/admin') ? 'active' : ''}>
            Dashboard
          </Link>
          <Link href="/admin/boat" className={isActive('/admin/boat') ? 'active' : ''}>
            My Boat
          </Link>
          <Link href="/admin/photos" className={isActive('/admin/photos') ? 'active' : ''}>
            Photos
          </Link>
          <Link href="/admin/posts" className={isActive('/admin/posts') ? 'active' : ''}>
            Blog Posts
          </Link>
          <Link href="/admin/tracking" className={isActive('/admin/tracking') ? 'active' : ''}>
            Live Tracking
          </Link>
        </nav>
        <button onClick={() => signOut({ callbackUrl: '/' })} className="secondary" style={{ width: '100%' }}>
          Logout
        </button>
      </aside>
      <section className="admin-content">{children}</section>
    </div>
  )
}
