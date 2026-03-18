import { useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useLocale } from '../context/LocaleContext';
import { supabase } from '../supabase';
import { useServices } from '../hooks/useAppData';
import TourCard from '../components/TourCard';
import { getTourCardAvailabilityLine } from '../utils/providerSettings';

export default function Explore() {
  const { t } = useLocale();
  const location = useLocation();
  const inApp = location.pathname.startsWith('/app');
  const { services, loading, error, refetch } = useServices();
  const [toast, setToast] = useState('');
  useEffect(() => {
    if (error) {
      setToast('Could not load tours. Try again.');
      const id = setTimeout(() => setToast(''), 2500);
      return () => clearTimeout(id);
    }
  }, [error]);
  const [typeFilter, setTypeFilter] = useState('all');
  const [regionFilter, setRegionFilter] = useState('');
  const [priceFilter, setPriceFilter] = useState(500);
  const [providerAvailById, setProviderAvailById] = useState({});

  useEffect(() => {
    const ids = [...new Set((services || []).map((s) => s.providerId).filter(Boolean))];
    if (!ids.length) {
      setProviderAvailById({});
      return;
    }
    supabase
      .from('users')
      .select('id,badges')
      .in('id', ids)
      .then(({ data }) => {
        const m = {};
        (data || []).forEach((row) => {
          m[row.id] = getTourCardAvailabilityLine(row.badges);
        });
        setProviderAvailById(m);
      })
      .catch(() => setProviderAvailById({}));
  }, [services]);

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

  return (
    <div className="explore-page" style={{ padding: '40px 24px 80px', maxWidth: 1200, margin: '0 auto' }}>
      {toast && (
        <div style={{ marginBottom: 16, padding: 12, borderRadius: 8, background: 'rgba(224,92,92,.1)', border: '1px solid rgba(224,92,92,.3)', color: 'var(--red)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <span>{toast}</span>
          <button type="button" onClick={() => { refetch(); setToast(''); }} style={{ padding: '6px 12px', borderRadius: 6, border: 'none', background: 'var(--surface)', cursor: 'pointer', fontSize: '0.85rem' }}>Retry</button>
        </div>
      )}
      <Helmet>
        <title>Explore tours — TourBid</title>
        <meta name="description" content="Browse van tours, guides, and transfers across Georgia." />
      </Helmet>
      <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '2rem', marginBottom: 8 }}>
        {t('explore.title')}
      </h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: 28 }}>{t('explore.subtitle')}</p>

      <div className="explore-filters" style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 32 }}>
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
        <div className="explore-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 24 }}>
          {filtered.map((t) => (
            <TourCard
              key={t.id}
              tour={t}
              linkTo={inApp ? `/app/tour/${t.id}` : `/tour/${t.id}`}
              providerAvailability={t.providerId ? providerAvailById[t.providerId] : undefined}
            />
          ))}
        </div>
      )}
      {!loading && filtered.length === 0 && (
        <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 60 }}>{t('explore.noMatch')}</div>
      )}
    </div>
  );
}
