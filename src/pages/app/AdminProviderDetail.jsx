import { useState, useEffect } from 'react';
import { useParams, useOutletContext, Navigate, Link } from 'react-router-dom';
import { supabase } from '../../supabase';
import { mapServiceRow, mapBookingRow } from '../../hooks/useAppData';
import { useLocale } from '../../context/LocaleContext';
import CollapsibleSection from '../../components/CollapsibleSection';

function parseGallery(g) {
  if (Array.isArray(g)) return g;
  if (typeof g === 'string') {
    try { return JSON.parse(g) || []; } catch (_) { return []; }
  }
  return [];
}

export default function AdminProviderDetail() {
  const { id } = useParams();
  const { user } = useOutletContext();
  const { t } = useLocale();
  const [provider, setProvider] = useState(null);
  const [tours, setTours] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      supabase.from('users').select('*').eq('id', id).eq('role', 'provider').maybeSingle(),
      supabase.from('services').select('*').eq('provider_id', id),
      supabase.from('bookings').select('*').eq('provider_id', id).order('created_at', { ascending: false }),
    ]).then(([pRes, tRes, jRes]) => {
      setProvider(pRes.data || null);
      setTours((tRes.data || []).map(mapServiceRow));
      setJobs((jRes.data || []).map(mapBookingRow));
      setLoading(false);
    });
  }, [id]);

  if (!user) return null;
  if (user.role !== 'admin') return <Navigate to="/app" replace />;
  if (loading) return <div style={{ color: 'var(--text-muted)' }}>Loading…</div>;
  if (!provider) return <div style={{ color: 'var(--text-muted)' }}>Provider not found.</div>;

  const p = provider;
  return (
    <div style={{ maxWidth: 800 }}>
      <Link to="/app/admin-providers" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: 20, textDecoration: 'none' }}>
        ← Back to providers
      </Link>
      <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.75rem', marginBottom: 8 }}>Provider: {p.name}</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: 24 }}>Profile, tours and jobs.</p>

      <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', marginBottom: 24 }}>
        {p.profile_picture ? (
          <img src={p.profile_picture} alt="" style={{ width: 120, height: 120, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--border)' }} />
        ) : (
          <div style={{ width: 120, height: 120, borderRadius: '50%', background: p.color || 'var(--gold)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: '2rem' }}>{(p.avatar || p.name || '?').slice(0, 2).toUpperCase()}</div>
        )}
        <div style={{ flex: 1, minWidth: 260 }}>
          <dl style={{ margin: 0, display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '6px 16px' }}>
            <dt style={{ color: 'var(--text-muted)' }}>ID</dt><dd style={{ margin: 0 }}>{p.id}</dd>
            <dt style={{ color: 'var(--text-muted)' }}>Name</dt><dd style={{ margin: 0 }}>{p.name}</dd>
            {p.email && <><dt style={{ color: 'var(--text-muted)' }}>Email</dt><dd style={{ margin: 0 }}>{p.email}</dd></>}
            <dt style={{ color: 'var(--text-muted)' }}>Type</dt><dd style={{ margin: 0 }}>{p.provider_type || p.type || '—'}</dd>
            <dt style={{ color: 'var(--text-muted)' }}>Rating</dt><dd style={{ margin: 0 }}>⭐ {p.rating ?? '—'}</dd>
            <dt style={{ color: 'var(--text-muted)' }}>Total bookings</dt><dd style={{ margin: 0 }}>{p.total_bookings ?? 0}</dd>
            {p.earnings != null && <><dt style={{ color: 'var(--text-muted)' }}>Earnings</dt><dd style={{ margin: 0 }}>{p.earnings}</dd></>}
            <dt style={{ color: 'var(--text-muted)' }}>Verified</dt><dd style={{ margin: 0 }}>{p.verified ? 'Yes' : 'No'}</dd>
            {p.vehicle_make && <><dt style={{ color: 'var(--text-muted)' }}>Vehicle</dt><dd style={{ margin: 0 }}>{p.vehicle_make} {p.vehicle_model || ''} {p.vehicle_year || ''} {p.vehicle_plate ? `· ${p.vehicle_plate}` : ''}</dd></>}
            {p.max_seats != null && <><dt style={{ color: 'var(--text-muted)' }}>Max seats</dt><dd style={{ margin: 0 }}>{p.max_seats}</dd></>}
            {p.bio && <><dt style={{ color: 'var(--text-muted)' }}>Bio</dt><dd style={{ margin: 0 }}>{p.bio}</dd></>}
          </dl>
        </div>
      </div>

      {parseGallery(p.gallery).length > 0 && (
        <CollapsibleSection title="Gallery" icon="🖼️" defaultOpen={true}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {parseGallery(p.gallery).map((src, i) => (
              <img key={i} src={typeof src === 'object' && src?.base64 ? src.base64 : src} alt="" style={{ width: 80, height: 80, borderRadius: 8, objectFit: 'cover', border: '1px solid var(--border)' }} />
            ))}
          </div>
        </CollapsibleSection>
      )}

      <CollapsibleSection title={`Tours (${tours.length})`} icon="🗺️" defaultOpen={true}>
        {tours.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', margin: 0 }}>No tours.</p>
        ) : (
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            {tours.map((t) => (
              <li key={t.id} style={{ marginBottom: 8 }}>
                <Link to={`/app/tour/${t.id}`} style={{ color: 'var(--gold)', fontWeight: 500 }}>{t.name}</Link>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}> · {t.region} · ₾{t.price} {t.suspended ? '(suspended)' : ''}</span>
              </li>
            ))}
          </ul>
        )}
      </CollapsibleSection>

      <CollapsibleSection title={`Jobs / Bookings (${jobs.length})`} icon="📅" defaultOpen={true}>
        {jobs.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', margin: 0 }}>No jobs yet.</p>
        ) : (
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            {jobs.map((b) => (
              <li key={b.id} style={{ marginBottom: 8, fontSize: '0.95rem' }}>
                <Link to={`/app/admin-booking/${b.id}`} style={{ color: 'var(--gold)', textDecoration: 'none' }}>{b.tourist} · {b.service} · {b.date} · ₾{b.amount} · {b.status}</Link>
              </li>
            ))}
          </ul>
        )}
      </CollapsibleSection>
    </div>
  );
}
