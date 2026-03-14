import { Link, useLocation } from 'react-router-dom';

export default function Layout({ children, user, onLogout }) {
  const loc = useLocation();

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header
        className="glass"
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          padding: '14px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <Link
          to="/"
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 700,
            fontSize: '1.35rem',
            letterSpacing: '-0.02em',
            color: 'var(--text)',
          }}
        >
          Georgia<span style={{ color: 'var(--gold)' }}>Tours</span>
        </Link>
        <nav style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
          <Link
            to="/"
            style={{
              fontSize: '0.9rem',
              fontWeight: 500,
              color: loc.pathname === '/' ? 'var(--gold)' : 'var(--text-muted)',
              transition: 'var(--transition)',
            }}
          >
            Home
          </Link>
          <Link
            to="/explore"
            style={{
              fontSize: '0.9rem',
              fontWeight: 500,
              color: loc.pathname === '/explore' ? 'var(--gold)' : 'var(--text-muted)',
              transition: 'var(--transition)',
            }}
          >
            Explore
          </Link>
          {user ? (
            <>
              <Link
                to="/bookings"
                style={{
                  fontSize: '0.9rem',
                  fontWeight: 500,
                  color: loc.pathname === '/bookings' ? 'var(--gold)' : 'var(--text-muted)',
                }}
              >
                Bookings
              </Link>
              <button
                onClick={onLogout}
                style={{
                  background: 'var(--surface-hover)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-muted)',
                  padding: '8px 16px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.85rem',
                }}
              >
                Sign out
              </button>
            </>
          ) : (
            <Link
              to="/login"
              style={{
                background: 'var(--gold)',
                color: 'var(--bg)',
                padding: '10px 20px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.9rem',
                fontWeight: 600,
              }}
            >
              Sign in
            </Link>
          )}
        </nav>
      </header>
      <main style={{ flex: 1 }}>{children}</main>
      <footer
        style={{
          marginTop: 'auto',
          padding: '32px 24px',
          borderTop: '1px solid var(--border)',
          textAlign: 'center',
          color: 'var(--text-dim)',
          fontSize: '0.8rem',
        }}
      >
        <p style={{ fontFamily: 'var(--font-classic)', fontSize: '1rem', color: 'var(--text-muted)', marginBottom: 4 }}>
          Explore Georgia
        </p>
        <p>GeorgiaTours · Est. 2024 · Same experience, reimagined.</p>
      </footer>
    </div>
  );
}
