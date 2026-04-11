export default function Footer() {
  const build = process.env.NEXT_PUBLIC_BUILD_SHA
  return (
    <footer>
      <p>Pamela & Lyyli — The Story of Passion and the Sea</p>
      <p>&copy; {new Date().getFullYear()} Tom Cruises</p>
      {build && <p style={{ fontSize: '0.7rem', opacity: 0.4 }}>build {build}</p>}
    </footer>
  )
}
