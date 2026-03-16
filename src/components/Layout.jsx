import { Link, useLocation } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabase';
import { useLocale } from '../context/LocaleContext';
import { useTheme } from '../context/ThemeContext';

export default function Layout({ children, user, onLogout }) {
  const loc = useLocation();
  const { t, locale, setLocale, localeNames } = useLocale();
  const { theme, toggleTheme } = useTheme();
  const [newsEmail, setNewsEmail] = useState('');
  const [newsStatus, setNewsStatus] = useState('');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const langRef = useRef(null);

  // Close mobile menu on route change
  useEffect(() => { setMobileOpen(false); }, [loc.pathname]);

  // Close lang dropdown on outside click
  useEffect(() => {
    if (!langOpen) return;
    const handler = (e) => { if (langRef.current && !langRef.current.contains(e.target)) setLangOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [langOpen]);

  const handleNewsletter = async (e) => {
    e.preventDefault();
    if (!newsEmail.trim()) return;
    setNewsStatus('');
    const { error } = await supabase.from('newsletter_subscribers').insert({ email: newsEmail.trim() });
    if (error) { setNewsStatus('error'); return; }
    setNewsStatus('success');
    setNewsEmail('');
  };

  const isActive = (to) => loc.pathname === to;

  const publicLinks = [
    { to: '/', label: t('nav.home') },
    { to: '/explore', label: t('nav.explore') },
    { to: '/stories', label: t('nav.stories') },
    { to: '/contact', label: t('nav.contact') },
  ];

  const authedLinks = user ? [
    { to: '/app/bookings', label: t('nav.bookings') },
    { to: '/app/chat', label: t('nav.chat') },
    { to: '/app/profile', label: t('nav.profile') },
  ] : [];

  const allLinks = [...publicLinks, ...authedLinks];

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* ─── HEADER ─── */}
      <header className="glass layout-header">
        <div className="layout-header-inner">
          {/* Logo */}
          <Link to="/" className="layout-logo">
            TourBid
          </Link>

          {/* Desktop nav */}
          <nav className="layout-nav-desktop">
            {allLinks.map(({ to, label }) => (
              <Link key={to} to={to} className={`layout-nav-link ${isActive(to) ? 'active' : ''}`}>
                {label}
                <span className="layout-nav-underline" />
              </Link>
            ))}
          </nav>

          {/* Right controls */}
          <div className="layout-controls">
            {/* Theme toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              className="layout-icon-btn"
              title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
            >
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>

            {/* Language dropdown */}
            <div ref={langRef} style={{ position: 'relative' }}>
              <button
                type="button"
                onClick={() => setLangOpen((o) => !o)}
                className="layout-icon-btn"
                style={{ fontSize: '0.85rem', gap: 4, display: 'flex', alignItems: 'center' }}
              >
                🌐 {localeNames[locale]}
                <span style={{ fontSize: '0.65rem', opacity: 0.6, marginLeft: 2 }}>▾</span>
              </button>
              <div className={`layout-dropdown ${langOpen ? 'open' : ''}`}>
                {Object.entries(localeNames).map(([lang, label]) => (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => { setLocale(lang); setLangOpen(false); }}
                    className={`layout-dropdown-item ${locale === lang ? 'active' : ''}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Auth button */}
            {user ? (
              <button onClick={onLogout} className="layout-btn-outline">
                {t('nav.signOut')}
              </button>
            ) : (
              <Link to="/login" className="layout-btn-primary">
                {t('nav.signIn')}
              </Link>
            )}

            {/* Hamburger (mobile) */}
            <button
              type="button"
              className={`layout-hamburger ${mobileOpen ? 'open' : ''}`}
              onClick={() => setMobileOpen((o) => !o)}
              aria-label="Menu"
            >
              <span /><span /><span />
            </button>
          </div>
        </div>
      </header>

      {/* ─── MOBILE MENU ─── */}
      <div className={`layout-mobile-overlay ${mobileOpen ? 'open' : ''}`} onClick={() => setMobileOpen(false)} />
      <nav className={`layout-mobile-menu ${mobileOpen ? 'open' : ''}`}>
        <div style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 4 }}>
          {allLinks.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              className={`layout-mobile-link ${isActive(to) ? 'active' : ''}`}
            >
              {label}
            </Link>
          ))}
          <div style={{ borderTop: '1px solid var(--border)', margin: '12px 0' }} />
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {Object.entries(localeNames).map(([lang, label]) => (
              <button
                key={lang}
                type="button"
                onClick={() => setLocale(lang)}
                className={`layout-lang-chip ${locale === lang ? 'active' : ''}`}
              >
                {label}
              </button>
            ))}
          </div>
          <div style={{ marginTop: 12 }}>
            {user ? (
              <button onClick={() => { onLogout?.(); setMobileOpen(false); }} className="layout-btn-outline" style={{ width: '100%' }}>
                {t('nav.signOut')}
              </button>
            ) : (
              <Link to="/login" className="layout-btn-primary" style={{ display: 'block', textAlign: 'center', width: '100%' }}>
                {t('nav.signIn')}
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* ─── MAIN ─── */}
      <main style={{ flex: 1 }}>{children}</main>

      {/* ─── FOOTER ─── */}
      <footer className="layout-footer">
        <div style={{ maxWidth: 600, margin: '0 auto', textAlign: 'center' }}>
          <p style={{ fontFamily: 'var(--font-classic)', fontSize: '1.1rem', color: 'var(--text-muted)', marginBottom: 8 }}>
            {t('footer.tagline')}
          </p>
          <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem', marginBottom: 8 }}>
            Contact: <a href="mailto:support@tourbid.ge" style={{ color: 'var(--gold)', textDecoration: 'none' }}>support@tourbid.ge</a>
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
              className="layout-btn-primary"
            >
              {t('newsletter.subscribe')}
            </button>
          </form>
          {newsStatus === 'success' && <p style={{ color: 'var(--gold)', marginBottom: 8 }}>{t('newsletter.subscribed')}</p>}
          {newsStatus === 'error' && <p style={{ color: '#f87171', marginBottom: 8 }}>Something went wrong. Try again.</p>}
          <p style={{ color: 'var(--text-dim)', fontSize: '0.8rem' }}>{t('footer.copyright')}</p>
        </div>
      </footer>
    </div>
  );
}
