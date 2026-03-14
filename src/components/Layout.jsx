import { Link, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { supabase } from '../supabase';
import { useLocale } from '../context/LocaleContext';
import { useTheme } from '../context/ThemeContext';

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
            <div style={{ display: 'flex', gap: 4 }}>
              {Object.entries(localeNames).map(([lang, label]) => (
                <button
                  key={lang}
                  type="button"
                  onClick={() => setLocale(lang)}
                  style={{
                    padding: '4px 8px',
                    borderRadius: 6,
                    border: '1px solid var(--border)',
                    background: locale === lang ? 'var(--gold-soft)' : 'transparent',
                    color: locale === lang ? 'var(--gold)' : 'var(--text-muted)',
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
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
