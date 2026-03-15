import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { stories } from '../data/stories';
import { useLocale } from '../context/LocaleContext';

export default function Stories() {
  const { t } = useLocale();

  return (
    <>
      <Helmet>
        <title>Stories — TourBid</title>
        <meta name="description" content="Travel stories and tips from Georgia." />
      </Helmet>
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '48px 24px 80px' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '2rem', marginBottom: 8 }}>{t('stories.title')}</h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: 40 }}>{t('stories.subtitle')}</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {stories.map((s) => (
            <Link
              key={s.slug}
              to={`/stories/${s.slug}`}
              style={{
                display: 'block',
                padding: 24,
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
                transition: 'var(--transition)',
                color: 'inherit',
                textDecoration: 'none',
              }}
            >
              <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '1.25rem', marginBottom: 8 }}>{s.title}</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: 1.5 }}>{s.excerpt}</p>
              <span style={{ color: 'var(--gold)', fontSize: '0.9rem', marginTop: 12, display: 'inline-block' }}>Read more →</span>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
