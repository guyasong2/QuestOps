export default function NavBar() {
  return (
    <header className="site-header">
      <a className="brand focusable" href="/" aria-label="QuestOps home">
        <img src="/QuestOps_logo.png" alt="QuestOps" />
      </a>

      <nav className="site-nav" aria-label="Primary navigation">
        <a className="focusable" href="/" aria-current="page">Home</a>
        <a className="focusable" href="/login">Login</a>
        <button className="nav-cta focusable" type="button">Get started</button>
      </nav>
    </header>
  );
}
