import { Link } from 'react-router-dom';
import { useLocale } from '../context/LocaleContext';
import { useTheme } from '../context/ThemeContext';

export default function Landing() {
  const { t, locale, setLocale, localeNames } = useLocale();
  const { theme, toggleTheme } = useTheme();

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, background: 'var(--bg)' }}>
      <div style={{ position: 'absolute', top: 24, right: 24, display: 'flex', gap: 12, alignItems: 'center' }}>
        <button type="button" onClick={toggleTheme} style={{ padding: '10px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', cursor: 'pointer' }}>
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
        <select value={locale} onChange={(e) => setLocale(e.target.value)} style={{ padding: '10px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)' }}>
          {Object.entries(localeNames).map(([code, label]) => (
            <option key={code} value={code}>{label}</option>
          ))}
        </select>
      </div>
      <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 'clamp(2rem, 5vw, 3rem)', marginBottom: 8, color: 'var(--text)' }}>
        Georgia<span style={{ color: 'var(--gold)' }}>Tours</span>
      </h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: 40, fontSize: '1.1rem' }}>{t('home.tagline')}</p>
      <Link
        to="/login"
        style={{
          padding: '16px 40px',
          borderRadius: 'var(--radius)',
          border: 'none',
          background: 'var(--gold)',
          color: 'var(--bg)',
          fontWeight: 700,
          fontSize: '1.1rem',
          textDecoration: 'none',
          boxShadow: '0 4px 20px rgba(201, 168, 76, 0.3)',
        }}
      >
        {t('nav.signIn')}
      </Link>
    </div>
  );
}
