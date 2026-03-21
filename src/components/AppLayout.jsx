import { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useLocale } from '../context/LocaleContext';
import { useTheme } from '../context/ThemeContext';
import { isProviderUser } from '../hooks/useAppData';

function useMediaQuery(query) {
  const [matches, setMatches] = useState(() => typeof window !== 'undefined' && window.matchMedia(query).matches);
  useEffect(() => {
    const m = window.matchMedia(query);
    const handler = () => setMatches(m.matches);
    m.addEventListener('change', handler);
    setMatches(m.matches);
    return () => m.removeEventListener('change', handler);
  }, [query]);
  return matches;
}

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

export default function AppLayout({ user, setUser, onLogout }) {
  const { t, locale, setLocale, localeNames } = useLocale();
  const { theme, toggleTheme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [langOpen, setLangOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useMediaQuery('(max-width: 768px)');

  useEffect(() => {
    if (isMobile) setSidebarOpen(false);
  }, [isMobile]);

  useEffect(() => {
    if (isMobile) setSidebarOpen(false);
  }, [isMobile, location.pathname]);

  const role = user?.role || 'tourist';
  const isProvider = isProviderUser(user);
  const isTourist = !isProvider && role === 'tourist';
  const isAdmin = role === 'admin';

  const touristNav = [
    { to: '/app/explore', label: t('nav.explore'), icon: '🔍' },
    { to: '/app/map', label: t('nav.map'), icon: '🗺️' },
    { to: '/app/requests', label: t('nav.requests'), icon: '📢' },
    { to: '/app/bookings', label: t('nav.bookings'), icon: '📅' },
    { to: '/app/favorites', label: 'Wishlist', icon: '♥' },
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
  const adminNavGroups = [
    { id: 'overview', label: t('nav.overview'), icon: '◈', items: [{ to: '/app/overview', label: t('nav.overview'), icon: '◈' }] },
    { id: 'data', label: t('nav.adminGroupData'), icon: '📋', items: [{ to: '/app/admin-bookings', label: t('nav.bookings'), icon: '📅' }, { to: '/app/admin-requests', label: t('nav.requests'), icon: '📋' }] },
    { id: 'people', label: t('nav.adminGroupPeople'), icon: '🗺️', items: [{ to: '/app/admin-providers', label: t('nav.providers'), icon: '👥' }, { to: '/app/admin-tours', label: t('nav.tours'), icon: '🗺️' }] },
    { id: 'more', label: t('nav.adminGroupMore'), icon: '💬', items: [{ to: '/app/admin-approvals', label: t('nav.approvals'), icon: '✅' }, { to: '/app/messages', label: t('nav.messages'), icon: '💬' }] },
  ];
  const [adminOpen, setAdminOpen] = useState({ overview: true, data: false, people: false, more: false });
  const toggleAdminGroup = (id) => setAdminOpen((o) => ({ ...o, [id]: !o[id] }));

  const nav = isAdmin ? null : isProvider ? providerNav : touristNav;
  const roleLabel = isAdmin ? 'Admin' : isProvider ? ((user?.type || user?.provider_type) === 'guide' ? 'Guide' : 'Driver') : 'Explorer';

  return (
    <div className="app-layout" style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Mobile overlay */}
      {isMobile && (
        <div
          className="app-layout-sidebar-overlay"
          aria-hidden
          style={{
            display: sidebarOpen ? 'block' : 'none',
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 90,
          }}
          onClick={() => setSidebarOpen(false)}
        />
      )}
      {/* Sidebar */}
      <aside
        className={`app-layout-sidebar ${isMobile && sidebarOpen ? 'mobile-open' : ''}`}
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
            className="app-layout-sidebar-toggle"
            style={{ padding: 8, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-muted)', cursor: 'pointer', minWidth: 44, minHeight: 44 }}
            aria-label={sidebarOpen ? 'Collapse menu' : 'Expand menu'}
          >
            {sidebarOpen ? '◀' : '▶'}
          </button>
        </div>
        <div style={{ padding: 12, flex: 1, overflowY: 'auto' }}>
          {sidebarOpen && (
            <p style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>{roleLabel}</p>
          )}
          {isAdmin && sidebarOpen ? (
            adminNavGroups.map((group) => (
              <div key={group.id} style={{ marginBottom: 8 }}>
                <button
                  type="button"
                  onClick={() => toggleAdminGroup(group.id)}
                  aria-expanded={adminOpen[group.id]}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 12px',
                    background: adminOpen[group.id] ? 'var(--gold-soft)' : 'transparent',
                    border: 'none',
                    color: adminOpen[group.id] ? 'var(--gold)' : 'var(--text-muted)',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    borderRadius: 'var(--radius-sm)',
                    fontFamily: 'inherit',
                    transition: 'background 0.15s, color 0.15s',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--surface-hover)'; e.currentTarget.style.color = 'var(--text)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = adminOpen[group.id] ? 'var(--gold-soft)' : 'transparent'; e.currentTarget.style.color = adminOpen[group.id] ? 'var(--gold)' : 'var(--text-muted)'; }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span>{group.icon}</span>
                    {group.label}
                  </span>
                  <span style={{ transform: adminOpen[group.id] ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s', display: 'inline-block' }}>▾</span>
                </button>
                {adminOpen[group.id] && (
                  <div style={{ paddingLeft: 8, marginTop: 2 }}>
                    {group.items.map((item) => (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        style={({ isActive }) => ({ ...linkStyle(isActive), marginBottom: 2 })}
                      >
                        <span>{item.icon}</span>
                        <span>{item.label}</span>
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>
            ))
          ) : isAdmin && !sidebarOpen ? (
            adminNavGroups.flatMap((g) => g.items).map((item) => (
              <NavLink key={item.to} to={item.to} style={({ isActive }) => ({ ...linkStyle(isActive), marginBottom: 4 })} title={item.label}>
                <span>{item.icon}</span>
              </NavLink>
            ))
          ) : (
            nav?.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                style={({ isActive }) => ({ ...linkStyle(isActive), marginBottom: 4 })}
              >
                <span>{item.icon}</span>
                {sidebarOpen && <span>{item.label}</span>}
              </NavLink>
            ))
          )}
        </div>
      </aside>

      {/* Main */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <header
          className="app-layout-header"
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
          {isMobile && (
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              style={{ marginRight: 'auto', padding: 10, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', cursor: 'pointer', minWidth: 44, minHeight: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              aria-label="Open menu"
            >
              <span style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <span style={{ display: 'block', width: 20, height: 2, background: 'currentColor', borderRadius: 1 }} />
                <span style={{ display: 'block', width: 20, height: 2, background: 'currentColor', borderRadius: 1 }} />
                <span style={{ display: 'block', width: 20, height: 2, background: 'currentColor', borderRadius: 1 }} />
              </span>
            </button>
          )}
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
          <Outlet context={{ user, setUser }} />
        </main>
      </div>
    </div>
  );
}
