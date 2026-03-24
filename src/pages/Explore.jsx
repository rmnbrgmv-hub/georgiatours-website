import { useLocation } from 'react-router-dom';
import { useState, useEffect, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { useLocale } from '../context/LocaleContext';
import { supabase } from '../supabase';
import { useServices } from '../hooks/useAppData';
import TourCard from '../components/TourCard';
import { SkeletonGrid } from '../components/Skeleton';
import { getTourCardAvailabilityLine } from '../utils/providerSettings';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { GEORGIA_CENTER, getTourCoords, getMarkerIcon, TourMapPopup } from '../components/MapUtils';

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
  const [showWelcome, setShowWelcome] = useState(!localStorage.getItem('tourbid-welcome-dismissed'));
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [regionFilter, setRegionFilter] = useState('');
  const [priceFilter, setPriceFilter] = useState(null);
  const [viewMode, setViewMode] = useState('list'); // list | map | split
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
    setPriceFilter((p) => {
      if (p == null) return priceMax; // show all tours by default once loaded
      return p > priceMax ? priceMax : p;
    });
  }, [priceMax]);

  const filtered = tours.filter((tour) => {
    if (search) {
      const q = search.toLowerCase();
      const match = (tour.name || '').toLowerCase().includes(q)
        || (tour.provider || '').toLowerCase().includes(q)
        || (tour.region || '').toLowerCase().includes(q)
        || (tour.desc || '').toLowerCase().includes(q);
      if (!match) return false;
    }
    if (typeFilter !== 'all' && tour.type !== typeFilter) return false;
    if (regionFilter && tour.region !== regionFilter && tour.area !== regionFilter) return false;
    if (priceFilter != null && (Number(tour.price) || 0) > priceFilter) return false;
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
      {showWelcome && (
        <div style={{
          background: 'linear-gradient(135deg, #1D9E75, #0F6E56)',
          color: '#fff',
          borderRadius: 12,
          padding: 20,
          marginBottom: 16,
          position: 'relative',
        }}>
          <button
            type="button"
            onClick={() => { localStorage.setItem('tourbid-welcome-dismissed', '1'); setShowWelcome(false); }}
            style={{ position: 'absolute', top: 12, right: 16, background: 'none', border: 'none', color: '#fff', fontSize: '1.3rem', cursor: 'pointer', lineHeight: 1, opacity: 0.8 }}
            aria-label="Dismiss"
          >&times;</button>
          <div style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: 6 }}>Welcome to TourBid! 🎉</div>
          <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>Browse tours, request custom trips, and chat with local providers.</div>
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
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search tours, guides, regions…"
          style={{
            padding: '10px 16px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border)',
            background: 'var(--surface)',
            color: 'var(--text)',
            fontSize: '0.9rem',
            minWidth: 220,
            flex: '1 1 220px',
          }}
        />
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
            value={priceFilter ?? priceMax}
            onChange={(e) => setPriceFilter(Number(e.target.value))}
            style={{ width: 100 }}
          />
          <span>₾{priceFilter ?? priceMax}</span>
        </label>
        <div style={{ display: 'flex', gap: 4, marginLeft: 'auto' }}>
          {['list', 'split', 'map'].map((m) => (
            <button
              key={m}
              onClick={() => setViewMode(m)}
              style={{
                padding: '8px 14px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border)',
                background: viewMode === m ? 'var(--accent, var(--gold))' : 'var(--surface)',
                color: viewMode === m ? '#fff' : 'var(--text-muted)',
                fontWeight: 500,
                fontSize: '0.85rem',
                cursor: 'pointer',
              }}
            >
              {m === 'list' ? '☰ List' : m === 'map' ? '🗺 Map' : '⬜ Split'}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <SkeletonGrid count={6} />
      ) : viewMode === 'map' ? (
        <div style={{ height: 'calc(100vh - 280px)', minHeight: 400, borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border)' }}>
          <MapContainer center={GEORGIA_CENTER} zoom={8} style={{ height: '100%', width: '100%' }}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap' />
            {filtered.map((tour) => (
              <Marker key={tour.id} position={getTourCoords(tour)} icon={getMarkerIcon(tour.type)}>
                <Popup><TourMapPopup tour={tour} /></Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      ) : viewMode === 'split' ? (
        <div style={{ display: 'flex', gap: 16, height: 'calc(100vh - 280px)', minHeight: 500 }}>
          <div style={{ flex: '0 0 380px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
            {filtered.map((tour) => (
              <TourCard
                key={tour.id}
                tour={tour}
                linkTo={inApp ? `/app/tour/${tour.id}` : `/tour/${tour.id}`}
                providerAvailability={tour.providerId ? providerAvailById[tour.providerId] : undefined}
              />
            ))}
            {filtered.length === 0 && <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 40 }}>{t('explore.noMatch')}</div>}
          </div>
          <div style={{ flex: 1, borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border)' }}>
            <MapContainer center={GEORGIA_CENTER} zoom={8} style={{ height: '100%', width: '100%' }}>
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap' />
              {filtered.map((tour) => (
                <Marker key={tour.id} position={getTourCoords(tour)} icon={getMarkerIcon(tour.type)}>
                  <Popup><TourMapPopup tour={tour} /></Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
        </div>
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
      {!loading && filtered.length === 0 && viewMode === 'list' && (
        <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 60 }}>{t('explore.noMatch')}</div>
      )}
    </div>
  );
}
