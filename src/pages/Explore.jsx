import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useLocale } from '../context/LocaleContext';
import { useServices } from '../hooks/useAppData';

export default function Explore() {
  const { t } = useLocale();
  const { services, loading } = useServices();
  const [typeFilter, setTypeFilter] = useState('all');
  const [regionFilter, setRegionFilter] = useState('');
  const [priceFilter, setPriceFilter] = useState(500);

  const tours = services.filter((s) => !s.suspended);
  const priceMax = tours.length ? Math.max(...tours.map((s) => Number(s.price) || 0), 1) : 500;
  useEffect(() => {
    setPriceFilter((p) => (p > priceMax ? priceMax : p));
  }, [priceMax]);

  const filtered = tours.filter((tour) => {
    if (typeFilter !== 'all' && tour.type !== typeFilter) return false;
    if (regionFilter && tour.region !== regionFilter && tour.area !== regionFilter) return false;
    if ((Number(tour.price) || 0) > priceFilter) return false;
    return true;
  });

  const regions = [...new Set(tours.flatMap((tour) => [tour.region, tour.area]).filter(Boolean))].sort();

  const getPhoto = (tour) => {
    const p = tour.photos?.[0];
    return (p && (p.base64 || p.url || p)) || null;
  };

  return (
    <div style={{ padding: '40px 24px 80px', maxWidth: 1200, margin: '0 auto' }}>
      <Helmet>
        <title>Explore tours — GeorgiaTours</title>
        <meta name="description" content="Browse van tours, guides, and transfers across Georgia." />
      </Helmet>
      <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '2rem', marginBottom: 8 }}>
        {t('explore.title')}
      </h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: 28 }}>{t('explore.subtitle')}</p>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 32 }}>
        <button
          onClick={() => setTypeFilter('all')}
          style={{
            padding: '10px 18px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border)',
            background: typeFilter === 'all' ? 'var(--gold-soft)' : 'var(--surface)',
            color: typeFilter === 'all' ? 'var(--gold)' : 'var(--text-muted)',
            fontWeight: 500,
            fontSize: '0.9rem',
          }}
        >
          {t('explore.all')}
        </button>
        {['guide', 'van', 'transfer'].map((t) => (
          <button
            key={t}
            onClick={() => setTypeFilter(t)}
            style={{
              padding: '10px 18px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border)',
              background: typeFilter === t ? 'var(--gold-soft)' : 'var(--surface)',
              color: typeFilter === t ? 'var(--gold)' : 'var(--text-muted)',
              fontWeight: 500,
              fontSize: '0.9rem',
            }}
          >
            {t === 'van' ? '🚐 Van' : t === 'guide' ? '🗺️ Guide' : '✈️ Transfer'}
          </button>
        ))}
        <select
          value={regionFilter}
          onChange={(e) => setRegionFilter(e.target.value)}
          style={{
            padding: '10px 18px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border)',
            background: 'var(--surface)',
            color: 'var(--text)',
            fontSize: '0.9rem',
          }}
        >
          <option value="">{t('explore.allRegions')}</option>
          {regions.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.9rem', color: 'var(--text-muted)' }}>
          <span>Max ₾</span>
          <input
            type="range"
            min={0}
            max={priceMax}
            value={priceFilter}
            onChange={(e) => setPriceFilter(Number(e.target.value))}
            style={{ width: 100 }}
          />
          <span>₾{priceFilter}</span>
        </label>
      </div>

      {loading ? (
        <div style={{ color: 'var(--text-muted)', padding: 60 }}>Loading…</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 24 }}>
          {filtered.map((t) => (
            <Link
              key={t.id}
              to={`/tour/${t.id}`}
              style={{
                display: 'block',
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
                overflow: 'hidden',
                transition: 'var(--transition)',
              }}
            >
              <div style={{ aspectRatio: '16/10', background: 'var(--bg-elevated)' }}>
                {getPhoto(t) ? (
                  <img src={getPhoto(t)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <span style={{ fontSize: '3rem', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                    {t.emoji || '🗺️'}
                  </span>
                )}
              </div>
              <div style={{ padding: 20 }}>
                <span
                  style={{
                    background: 'var(--gold-soft)',
                    color: 'var(--gold)',
                    padding: '2px 8px',
                    borderRadius: 6,
                    fontSize: '0.7rem',
                    fontWeight: 600,
                  }}
                >
                  {t.type === 'van' ? 'Van' : t.type === 'guide' ? 'Guide' : 'Transfer'}
                </span>
                <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '1.05rem', marginTop: 10, marginBottom: 6 }}>
                  {t.name}
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: 12 }}>
                  {t.region} · {t.duration} · ⭐ {t.rating || '—'}
                </p>
                <p style={{ fontFamily: 'var(--font-classic)', fontSize: '1.35rem', color: 'var(--gold)' }}>₾{t.price}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
      {!loading && filtered.length === 0 && (
        <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 60 }}>{t('explore.noMatch')}</div>
      )}
    </div>
  );
}
