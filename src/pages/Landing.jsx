import { Link } from 'react-router-dom';
import { useLocale } from '../context/LocaleContext';
import { useTheme } from '../context/ThemeContext';

const HERO_IMAGES = 30;
const imageSrcs = Array.from({ length: HERO_IMAGES }, (_, i) => `/geoimages/${i + 1}.jpg`);

export default function Landing() {
  const { t, locale, setLocale, localeNames } = useLocale();
  const { theme, toggleTheme } = useTheme();

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, background: 'var(--bg)', position: 'relative', overflow: 'hidden' }}>
      {/* Theme & language — fixed top-right so always visible */}
      <div style={{ position: 'fixed', top: 24, right: 24, display: 'flex', gap: 12, alignItems: 'center', zIndex: 10 }}>
        <button type="button" onClick={toggleTheme} style={{ padding: '10px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', cursor: 'pointer', boxShadow: '0 2px 12px rgba(0,0,0,0.2)' }}>
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
        <select value={locale} onChange={(e) => setLocale(e.target.value)} style={{ padding: '10px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', boxShadow: '0 2px 12px rgba(0,0,0,0.2)' }}>
          {Object.entries(localeNames).map(([code, label]) => (
            <option key={code} value={code}>{label}</option>
          ))}
        </select>
      </div>

      {/* Collage layer: wave tile grid with edge fades */}
      <div className="landing-hero-collage" aria-hidden>
        <div className="landing-hero-collage-inner">
          {imageSrcs.map((src, i) => (
            <div key={i} className="landing-hero-tile" style={{ ['--i']: i }}>
              <img src={src} alt="" loading="lazy" />
            </div>
          ))}
        </div>
        <div className="landing-hero-fade landing-hero-fade-t" />
        <div className="landing-hero-fade landing-hero-fade-b" />
        <div className="landing-hero-fade landing-hero-fade-l" />
        <div className="landing-hero-fade landing-hero-fade-r" />
      </div>

      {/* Main greeting (above collage) */}
      <div style={{ position: 'relative', zIndex: 2, textAlign: 'center' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 'clamp(2rem, 5vw, 3rem)', marginBottom: 8, color: 'var(--text)', textShadow: '0 2px 20px rgba(0,0,0,0.5)' }}>
          Georgia<span style={{ color: 'var(--gold)' }}>Tours</span>
        </h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: 40, fontSize: '1.1rem', textShadow: '0 1px 10px rgba(0,0,0,0.4)' }}>{t('home.tagline')}</p>
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
    </div>
  );
}
