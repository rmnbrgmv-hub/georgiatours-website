import { Link, useLocation } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import { supabase } from '../supabase';
import { useLocale } from '../context/LocaleContext';
import { useTheme } from '../context/ThemeContext';

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
  return (
    <div
      ref={wrapRef}
      style={{ position: 'relative', display: 'flex', alignItems: 'center' }}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Select language"
        aria-expanded={open}
        style={{
          width: 40,
          height: 40,
          borderRadius: '50%',
          border: '1px solid var(--border)',
          background: open ? 'var(--gold-soft)' : 'var(--surface-hover)',
          color: open ? 'var(--gold)' : 'var(--text-muted)',
          fontSize: '1.25rem',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'var(--transition)',
        }}
      >
        🌐
      </button>
      {open && (
        <div
          className="glass"
          style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            marginTop: 8,
            padding: 12,
            borderRadius: 'var(--radius)',
            border: '1px solid var(--border)',
            boxShadow: '0 12px 32px rgba(0,0,0,0.25)',
            zIndex: 100,
            minWidth: 140,
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
            animation: 'langPop 0.2s ease',
          }}
        >
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>{t('nav.language')}</div>
          {langs.map(([lang, label]) => (
            <button
              key={lang}
              type="button"
              onClick={() => { setLocale(lang); setOpen(false); }}
              style={{
                padding: '8px 12px',
                borderRadius: 8,
                border: 'none',
                background: locale === lang ? 'var(--gold-soft)' : 'transparent',
                color: locale === lang ? 'var(--gold)' : 'var(--text)',
                fontSize: '0.9rem',
                cursor: 'pointer',
                textAlign: 'start',
                transition: 'var(--transition)',
              }}
            >
              {label}
            </button>
          ))}
        </div>
      )}
      <style>{`
        @keyframes langPop {
          from { opacity: 0; transform: translateY(-6px); }
          to { opacity: 1; transform: translateY(0); }
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
        <nav style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
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
            <GlobeLangSelect locale={locale} setLocale={setLocale} localeNames={localeNames} t={t} />
          </div>
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
