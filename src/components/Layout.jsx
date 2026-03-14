import { Link, useLocation } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import { supabase } from '../supabase';
import { useLocale } from '../context/LocaleContext';
import { useTheme } from '../context/ThemeContext';

const GLOBE_SVG = (
  <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%', display: 'block' }} aria-hidden>
    <defs>
      <radialGradient id="globeShade" cx="30%" cy="30%">
        <stop offset="0%" stopColor="rgba(255,255,255,0.4)" />
        <stop offset="100%" stopColor="rgba(255,255,255,0)" />
      </radialGradient>
      <linearGradient id="sea" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="rgba(100,160,220,0.35)" />
        <stop offset="100%" stopColor="rgba(60,120,200,0.2)" />
      </linearGradient>
    </defs>
    <circle cx="50" cy="50" r="48" fill="url(#sea)" stroke="rgba(255,255,255,0.25)" strokeWidth="1" />
    <path fill="rgba(180,200,160,0.6)" d="M50 8c-8 4-18 14-18 24s6 18 18 20c12-2 18-10 18-20S58 12 50 8z" />
    <path fill="rgba(160,190,140,0.55)" d="M30 45c0 12 10 22 20 28 10-6 20-16 20-28s-8-20-20-24c-12 4-20 12-20 24z" />
    <path fill="rgba(170,195,150,0.5)" d="M50 72c14-4 26-14 26-26 0-6-4-14-12-18-8 2-16 8-22 16-6 8-4 18 8 28z" />
    <path fill="rgba(150,180,130,0.55)" d="M24 38c4 10 14 16 26 18-2-10-10-18-20-22-10 2-6 4-6 4z" />
    <circle cx="50" cy="50" r="48" fill="url(#globeShade)" style={{ pointerEvents: 'none' }} />
  </svg>
);

function GlobeLangSelect({ locale, setLocale, localeNames, t }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    const close = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    if (open) {
      document.addEventListener('click', close);
      return () => document.removeEventListener('click', close);
    }
  }, [open]);

  const langs = Object.entries(localeNames);
  const center = 100;
  const orbitRadius = 72;
  return (
    <div
      ref={wrapRef}
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        paddingBottom: open ? 220 : 0,
        transition: 'padding 0.15s ease',
      }}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Select language"
        aria-expanded={open}
        style={{
          width: 56,
          height: 56,
          borderRadius: '50%',
          border: '1px solid rgba(255,255,255,0.12)',
          background: 'transparent',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'var(--transition)',
          overflow: 'hidden',
        }}
      >
        <span style={{ width: 44, height: 44 }}>{GLOBE_SVG}</span>
      </button>
      {open && (
        <div
          className="glass"
          style={{
            position: 'absolute',
            top: '100%',
            left: '50%',
            transform: 'translateX(-50%)',
            marginTop: 4,
            padding: 16,
            borderRadius: 'var(--radius)',
            border: '1px solid var(--border)',
            boxShadow: '0 12px 32px rgba(0,0,0,0.25)',
            zIndex: 100,
            width: 200,
            height: 200,
            animation: 'langPop 0.2s ease',
          }}
        >
          <div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)', width: 56, height: 56 }}>
            {GLOBE_SVG}
          </div>
          {langs.map(([lang, label], i) => {
            const angle = (i / langs.length) * 2 * Math.PI - Math.PI / 2;
            const x = center + orbitRadius * Math.cos(angle);
            const y = center + orbitRadius * Math.sin(angle);
            return (
              <button
                key={lang}
                type="button"
                onClick={() => { setLocale(lang); setOpen(false); }}
                style={{
                  position: 'absolute',
                  left: `${x}px`,
                  top: `${y}px`,
                  transform: 'translate(-50%, -50%)',
                  padding: '6px 10px',
                  borderRadius: 8,
                  border: 'none',
                  background: locale === lang ? 'var(--gold-soft)' : 'var(--surface-hover)',
                  color: locale === lang ? 'var(--gold)' : 'var(--text)',
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'var(--transition)',
                }}
              >
                {label}
              </button>
            );
          })}
        </div>
      )}
      <style>{`
        @keyframes langPop {
          from { opacity: 0; transform: translateX(-50%) translateY(-6px); }
          to { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
      `}</style>
    </div>
  );
}

export default function Layout({ children, user, onLogout }) {
  const loc = useLocation();
  const { t, locale, setLocale, localeNames } = useLocale();
  const { theme, toggleTheme } = useTheme();
  const [newsEmail, setNewsEmail] = useState('');
  const [newsStatus, setNewsStatus] = useState(''); // 'success' | 'error' | ''

  const handleNewsletter = async (e) => {
    e.preventDefault();
    if (!newsEmail.trim()) return;
    setNewsStatus('');
    const { error } = await supabase.from('newsletter_subscribers').insert({ email: newsEmail.trim() });
    if (error) {
      setNewsStatus('error');
      return;
    }
    setNewsStatus('success');
    setNewsEmail('');
  };

  const navLink = (to, label) => (
    <Link
      to={to}
      style={{
        fontSize: '0.9rem',
        fontWeight: 500,
        color: loc.pathname === to ? 'var(--gold)' : 'var(--text-muted)',
        transition: 'var(--transition)',
      }}
    >
      {label}
    </Link>
  );

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header
        className="glass"
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          padding: '14px 24px',
          display: 'grid',
          gridTemplateColumns: '1fr auto 1fr',
          alignItems: 'center',
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
            justifySelf: 'start',
          }}
        >
          Georgia<span style={{ color: 'var(--gold)' }}>Tours</span>
        </Link>
        <div style={{ justifySelf: 'center', display: 'flex', justifyContent: 'center' }}>
          <GlobeLangSelect locale={locale} setLocale={setLocale} localeNames={localeNames} t={t} />
        </div>
        <nav style={{ display: 'flex', alignItems: 'center', gap: 24, justifySelf: 'end' }}>
          {navLink('/', t('nav.home'))}
          {navLink('/explore', t('nav.explore'))}
          {navLink('/map', t('nav.map'))}
          {navLink('/stories', t('nav.stories'))}
          {navLink('/contact', t('nav.contact'))}
          {user ? (
            <>
              {navLink('/bookings', t('nav.bookings'))}
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
                {t('nav.signOut')}
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
              {t('nav.signIn')}
            </Link>
          )}
          <button
            type="button"
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Switch to light' : 'Switch to dark'}
            aria-label="Toggle theme"
            style={{
              padding: '8px 10px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border)',
              background: 'var(--surface-hover)',
              color: 'var(--text)',
              fontSize: '1.1rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
        </nav>
      </header>
      <main style={{ flex: 1 }}>{children}</main>
      <footer
        style={{
          marginTop: 'auto',
          padding: '32px 24px',
          borderTop: '1px solid var(--border)',
          color: 'var(--text-dim)',
          fontSize: '0.8rem',
        }}
      >
        <div style={{ maxWidth: 600, margin: '0 auto', textAlign: 'center' }}>
          <p style={{ fontFamily: 'var(--font-classic)', fontSize: '1rem', color: 'var(--text-muted)', marginBottom: 8 }}>
            {t('footer.tagline')}
          </p>
          <form onSubmit={handleNewsletter} style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 16 }}>
            <input
              type="email"
              value={newsEmail}
              onChange={(e) => setNewsEmail(e.target.value)}
              placeholder={t('newsletter.placeholder')}
              required
              style={{
                padding: '10px 14px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border)',
                background: 'var(--surface)',
                color: 'var(--text)',
                fontSize: '0.9rem',
                minWidth: 200,
              }}
            />
            <button
              type="submit"
              style={{
                padding: '10px 20px',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                background: 'var(--gold)',
                color: 'var(--bg)',
                fontWeight: 600,
                fontSize: '0.9rem',
              }}
            >
              {t('newsletter.subscribe')}
            </button>
          </form>
          {newsStatus === 'success' && <p style={{ color: 'var(--gold)', marginBottom: 8 }}>{t('newsletter.subscribed')}</p>}
          {newsStatus === 'error' && <p style={{ color: '#f87171', marginBottom: 8 }}>Something went wrong. Try again.</p>}
          <p>{t('footer.copyright')}</p>
        </div>
      </footer>
    </div>
  );
}
