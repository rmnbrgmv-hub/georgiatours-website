import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useLocale } from '../context/LocaleContext';
import { useTheme } from '../context/ThemeContext';

const linkStyle = (isActive) => ({
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  padding: '12px 16px',
  borderRadius: 'var(--radius-sm)',
  color: isActive ? 'var(--gold)' : 'var(--text-muted)',
  background: isActive ? 'var(--gold-soft)' : 'transparent',
  textDecoration: 'none',
  fontWeight: isActive ? 600 : 500,
  fontSize: '0.95rem',
  transition: 'var(--transition)',
});

export default function AppLayout({ user, onLogout }) {
  const { t, locale, setLocale, localeNames } = useLocale();
  const { theme, toggleTheme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [langOpen, setLangOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const navigate = useNavigate();

  const role = user?.role || 'tourist';
  const isTourist = role === 'tourist';
  const isProvider = role === 'provider';
  const isAdmin = role === 'admin';

  const touristNav = [
    { to: '/app/explore', label: t('nav.explore'), icon: '🔍' },
    { to: '/app/map', label: t('nav.map'), icon: '🗺️' },
    { to: '/app/requests', label: t('nav.requests'), icon: '📢' },
    { to: '/app/bookings', label: t('nav.bookings'), icon: '📅' },
    { to: '/app/chat', label: t('nav.chat'), icon: '💬' },
    { to: '/app/profile', label: t('nav.profile'), icon: '👤' },
  ];
  const providerNav = [
    { to: '/app/dashboard', label: t('nav.dashboard'), icon: '📊' },
    { to: '/app/tours', label: t('nav.myTours'), icon: '🗺️' },
    { to: '/app/requests', label: t('nav.requests'), icon: '📢' },
    { to: '/app/jobs', label: t('nav.jobs'), icon: '📋' },
    { to: '/app/chat', label: t('nav.chat'), icon: '💬' },
    { to: '/app/profile', label: t('nav.profile'), icon: '👤' },
  ];
  const adminNav = [
    { to: '/app/overview', label: t('nav.overview'), icon: '◈' },
    { to: '/app/admin-bookings', label: t('nav.bookings'), icon: '📅' },
    { to: '/app/admin-requests', label: t('nav.requests'), icon: '📋' },
    { to: '/app/admin-providers', label: t('nav.providers'), icon: '👥' },
    { to: '/app/admin-tours', label: t('nav.tours'), icon: '🗺️' },
    { to: '/app/admin-approvals', label: t('nav.approvals'), icon: '✅' },
    { to: '/app/messages', label: t('nav.messages'), icon: '💬' },
  ];

  const nav = isAdmin ? adminNav : isProvider ? providerNav : touristNav;
  const roleLabel = isAdmin ? 'Admin' : isProvider ? (user?.type === 'guide' ? 'Guide' : 'Driver') : 'Explorer';

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Sidebar */}
      <aside
        style={{
          width: sidebarOpen ? 260 : 72,
          flexShrink: 0,
          background: 'var(--bg-elevated)',
          borderRight: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          transition: 'width 0.2s ease',
        }}
      >
        <div style={{ padding: '20px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {sidebarOpen && (
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.2rem', color: 'var(--text)' }}>
              {t('nav.appName')}<span style={{ color: 'var(--gold)' }}></span>
            </span>
          )}
          <button
            type="button"
            onClick={() => setSidebarOpen((o) => !o)}
            style={{ padding: 8, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-muted)', cursor: 'pointer' }}
          >
            {sidebarOpen ? '◀' : '▶'}
          </button>
        </div>
        <div style={{ padding: 12, flex: 1, overflowY: 'auto' }}>
          {sidebarOpen && (
            <p style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>{roleLabel}</p>
          )}
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              style={({ isActive }) => ({ ...linkStyle(isActive), marginBottom: 4 })}
            >
              <span>{item.icon}</span>
              {sidebarOpen && <span>{item.label}</span>}
            </NavLink>
          ))}
        </div>
      </aside>

      {/* Main */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <header
          style={{
            height: 56,
            padding: '0 24px',
            borderBottom: '1px solid var(--border)',
            background: 'var(--surface)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: 16,
          }}
        >
          <button
            type="button"
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Light' : 'Dark'}
            style={{ width: 40, height: 40, borderRadius: '50%', border: '1px solid var(--border)', background: 'var(--surface-hover)', color: 'var(--text)', fontSize: '1.1rem', cursor: 'pointer' }}
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
          <div style={{ position: 'relative' }}>
            <button
              type="button"
              onClick={() => setLangOpen((o) => !o)}
              style={{ padding: '8px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--surface-hover)', color: 'var(--text)', fontSize: '0.9rem', cursor: 'pointer' }}
            >
              {localeNames[locale]} ▾
            </button>
            {langOpen && (
              <>
                <div style={{ position: 'fixed', inset: 0, zIndex: 10 }} onClick={() => setLangOpen(false)} />
                <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: 4, padding: 8, background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', boxShadow: '0 8px 24px rgba(0,0,0,0.2)', zIndex: 20, minWidth: 120 }}>
                  {Object.entries(localeNames).map(([lang, label]) => (
                    <button key={lang} type="button" onClick={() => { setLocale(lang); setLangOpen(false); }} style={{ display: 'block', width: '100%', padding: '8px 12px', textAlign: 'start', background: 'none', border: 'none', color: 'var(--text)', cursor: 'pointer', borderRadius: 6 }}>
                      {label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
          <div style={{ position: 'relative' }}>
            <button
              type="button"
              onClick={() => setUserMenuOpen((o) => !o)}
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--surface-hover)', color: 'var(--text)', cursor: 'pointer' }}
            >
              <span style={{ width: 32, height: 32, borderRadius: '50%', background: user?.color || 'var(--gold)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: '0.85rem' }}>
                {(user?.avatar || user?.name || '?').slice(0, 2).toUpperCase()}
              </span>
              {user?.name?.split(' ')[0]}
            </button>
            {userMenuOpen && (
              <>
                <div style={{ position: 'fixed', inset: 0, zIndex: 10 }} onClick={() => setUserMenuOpen(false)} />
                <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: 4, padding: 8, background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', boxShadow: '0 8px 24px rgba(0,0,0,0.2)', zIndex: 20, minWidth: 160 }}>
                  <NavLink to="/app/profile" style={{ display: 'block', padding: '8px 12px', color: 'var(--text)', textDecoration: 'none', borderRadius: 6 }} onClick={() => setUserMenuOpen(false)}>{t('nav.profile')}</NavLink>
                  <button type="button" onClick={() => { onLogout(); setUserMenuOpen(false); navigate('/login'); }} style={{ display: 'block', width: '100%', padding: '8px 12px', textAlign: 'start', background: 'none', border: 'none', color: 'var(--text)', cursor: 'pointer', borderRadius: 6 }}>
                    {t('nav.signOut')}
                  </button>
                </div>
              </>
            )}
          </div>
        </header>
        <main style={{ flex: 1, overflow: 'auto', padding: 24 }}>
          <Outlet context={{ user }} />
        </main>
      </div>
    </div>
  );
}
