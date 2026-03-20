import { useEffect, useState } from 'react';

const BYPASS_KEY = 'tourbid-access';
const BYPASS_VALUE = 'granted';

export function checkBypass() {
  if (typeof window === 'undefined') return false;
  const params = new URLSearchParams(window.location.search);
  if (params.get('access') === 'tourbid2026') {
    localStorage.setItem(BYPASS_KEY, BYPASS_VALUE);
    return true;
  }
  return localStorage.getItem(BYPASS_KEY) === BYPASS_VALUE;
}

export default function UnderConstruction() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  return (
    <div style={styles.wrapper}>
      <div style={styles.bg} />
      <div style={styles.content}>
        <div style={styles.logoRow}>
          <span style={styles.logo}>TourBid</span>
        </div>
        <h1 style={styles.heading}>
          Something Amazing<br />Is Coming Soon
        </h1>
        <p style={styles.sub}>
          We're building the ultimate platform connecting travelers with local guides
          and drivers across Georgia. Stay tuned!
        </p>

        {!submitted ? (
          <form
            style={styles.form}
            onSubmit={(e) => {
              e.preventDefault();
              if (email.trim()) setSubmitted(true);
            }}
          >
            <input
              type="email"
              placeholder="Enter your email for updates"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={styles.input}
              required
            />
            <button type="submit" style={styles.btn}>Notify Me</button>
          </form>
        ) : (
          <p style={styles.thanks}>Thanks! We'll keep you posted.</p>
        )}

        <div style={styles.socials}>
          <span style={styles.dot} />
          <span style={styles.statusText}>Under Construction</span>
          <span style={styles.dot} />
        </div>
      </div>

      <style>{`
        @keyframes uc-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        @keyframes uc-gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>
    </div>
  );
}

const styles = {
  wrapper: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#06060a',
    position: 'relative',
    overflow: 'hidden',
    fontFamily: "'DM Sans', sans-serif",
  },
  bg: {
    position: 'absolute',
    inset: 0,
    background: 'radial-gradient(ellipse at 30% 20%, rgba(201,168,76,0.12) 0%, transparent 50%), radial-gradient(ellipse at 70% 80%, rgba(34,211,238,0.08) 0%, transparent 50%)',
    pointerEvents: 'none',
  },
  content: {
    position: 'relative',
    zIndex: 1,
    textAlign: 'center',
    padding: '2rem',
    maxWidth: 600,
  },
  logoRow: {
    marginBottom: '2rem',
  },
  logo: {
    fontFamily: "'Syne', sans-serif",
    fontSize: '2rem',
    fontWeight: 800,
    color: '#c9a84c',
    letterSpacing: '-0.02em',
  },
  heading: {
    fontFamily: "'Syne', sans-serif",
    fontSize: 'clamp(2rem, 5vw, 3.2rem)',
    fontWeight: 700,
    color: '#f4f4f5',
    lineHeight: 1.15,
    marginBottom: '1.25rem',
  },
  sub: {
    color: '#a1a1aa',
    fontSize: '1.1rem',
    lineHeight: 1.6,
    marginBottom: '2.5rem',
  },
  form: {
    display: 'flex',
    gap: '0.75rem',
    justifyContent: 'center',
    flexWrap: 'wrap',
    marginBottom: '2.5rem',
  },
  input: {
    padding: '0.85rem 1.25rem',
    borderRadius: 12,
    border: '1px solid rgba(255,255,255,0.1)',
    background: 'rgba(255,255,255,0.05)',
    color: '#f4f4f5',
    fontSize: '1rem',
    outline: 'none',
    width: 280,
    fontFamily: "'DM Sans', sans-serif",
  },
  btn: {
    padding: '0.85rem 2rem',
    borderRadius: 12,
    border: 'none',
    background: 'linear-gradient(135deg, #c9a84c, #b8942e)',
    color: '#06060a',
    fontWeight: 700,
    fontSize: '1rem',
    cursor: 'pointer',
    fontFamily: "'DM Sans', sans-serif",
  },
  thanks: {
    color: '#c9a84c',
    fontSize: '1.1rem',
    marginBottom: '2.5rem',
  },
  socials: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.75rem',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: '50%',
    background: '#c9a84c',
    animation: 'uc-pulse 2s ease-in-out infinite',
  },
  statusText: {
    color: '#71717a',
    fontSize: '0.9rem',
    textTransform: 'uppercase',
    letterSpacing: '0.15em',
  },
};
