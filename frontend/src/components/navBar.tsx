import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function NavBar() {
  const navigate = useNavigate();
  const { token } = useAuth();

  return (
    <header className="site-header">
      <a className="brand focusable" href="/" aria-label="QuestOps home">
        <img src="/QuestOps_logo.png" alt="QuestOps" />
      </a>

      <nav className="site-nav" aria-label="Primary navigation">
        <a className="focusable" href="/" aria-current="page">Home</a>
        {!token && <a className="focusable" href="/login">Login</a>}
        
        {token ? (
          <button
            className="nav-cta focusable"
            type="button"
            onClick={() => navigate('/dashboard')}
          >
            Dashboard
          </button>
        ) : (
          <button
            className="nav-cta focusable"
            type="button"
            onClick={() => navigate('/onboarding')}
          >
            Get started
          </button>
        )}
      </nav>
    </header>
  );
}
