import Link from 'next/link'

export default function Header() {
  return (
    <header>
      <div className="header-inner">
        <Link href="/" className="logo">
          Tom <span>Cruises</span>
        </Link>
        <nav>
          <Link href="/">Home</Link>
          <Link href="/blog">Stories</Link>
          <Link href="/tracking">Live Tracking</Link>
          <Link href="/admin">Admin</Link>
        </nav>
      </div>
    </header>
  )
}
